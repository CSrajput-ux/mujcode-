FROM golang:1.21-alpine
RUN addgroup -S judge && adduser -S judge -G judge
WORKDIR /workspace
RUN chown -R judge:judge /workspace
USER judge
