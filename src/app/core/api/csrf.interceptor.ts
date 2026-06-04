import { HttpInterceptorFn } from '@angular/common/http';

function getCsrfTokenFromCookie(): string {
    const match = document.cookie.match(/(?:^|;\s*)csrf_token=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export const csrfInterceptor: HttpInterceptorFn = (req, next) => {
    if (!['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        return next(req);
    }

    const csrfToken = getCsrfTokenFromCookie();
    if (!csrfToken) {
        return next(req);
    }

    const csrfReq = req.clone({
        setHeaders: { 'X-CSRF-Token': csrfToken },
    });

    return next(csrfReq);
};
