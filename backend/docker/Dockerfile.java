FROM openjdk:17-slim
RUN groupadd -r judge && useradd -r -g judge judge
WORKDIR /workspace
RUN chown -R judge:judge /workspace
USER judge
