FROM gcc:12-bullseye

# Create a non-root user for security
RUN groupadd -r judge && useradd -r -g judge judge

# Create a workspace directory
WORKDIR /workspace

# Change ownership of workspace
RUN chown -R judge:judge /workspace

# Switch to the non-root user
USER judge
