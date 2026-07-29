FROM php:8.2-cli-alpine
RUN addgroup -S judge && adduser -S judge -G judge
WORKDIR /workspace
RUN chown -R judge:judge /workspace
USER judge
