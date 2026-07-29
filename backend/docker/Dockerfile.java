FROM eclipse-temurin:17-jdk-alpine
RUN addgroup -S judge && adduser -S judge -G judge
WORKDIR /workspace
RUN chown -R judge:judge /workspace
USER judge
