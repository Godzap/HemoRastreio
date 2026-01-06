import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { AuthenticatedUser } from '../interfaces';

/**
 * Guard that ensures users can only access resources within their own laboratory.
 * Global admins bypass this check.
 */
@Injectable()
export class LaboratoryGuard implements CanActivate {
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const user: AuthenticatedUser = request.user;

        if (!user) {
            throw new ForbiddenException('Access denied');
        }

        // Global admins can access any laboratory
        if (user.isGlobalAdmin) {
            return true;
        }

        // Get laboratory ID from route params or query
        const requestedLabId =
            request.params?.laboratoryId ||
            request.query?.laboratoryId ||
            request.body?.laboratoryId;

        // If no specific laboratory is requested, allow (will be filtered by RLS)
        if (!requestedLabId) {
            return true;
        }

        // Ensure user belongs to the requested laboratory
        if (user.laboratoryId !== requestedLabId) {
            throw new ForbiddenException('Access to this laboratory is not allowed');
        }

        return true;
    }
}
