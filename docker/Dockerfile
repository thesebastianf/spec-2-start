# ===================================
# Spec-2-Start — Self-Hosted Wizard
# Served by nginx:alpine (static files)
# ===================================

FROM nginx:alpine

RUN apk add --no-cache wget

# Remove default nginx page
RUN rm -rf /usr/share/nginx/html/*

# Copy app static files (relative to build context = repo root)
COPY app/ /usr/share/nginx/html/

# Copy nginx config
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://localhost/health || exit 1

EXPOSE 80

LABEL org.opencontainers.image.title="Spec-2-Start"
LABEL org.opencontainers.image.description="Self-hosted repo setup wizard"
