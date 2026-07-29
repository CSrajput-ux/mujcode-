Write-Host "Building Java Image..."
docker build -t mujcode-compiler-java -f docker/Dockerfile.java docker/

Write-Host "Building Python Image..."
docker build -t mujcode-compiler-python -f docker/Dockerfile.python docker/

Write-Host "Building Node Image..."
docker build -t mujcode-compiler-node -f docker/Dockerfile.node docker/

Write-Host "Building Go Image..."
docker build -t mujcode-compiler-go -f docker/Dockerfile.go docker/

Write-Host "Building Rust Image..."
docker build -t mujcode-compiler-rust -f docker/Dockerfile.rust docker/

Write-Host "Building C# Image..."
docker build -t mujcode-compiler-csharp -f docker/Dockerfile.csharp docker/

Write-Host "Building PHP Image..."
docker build -t mujcode-compiler-php -f docker/Dockerfile.php docker/

Write-Host "All images built successfully!"
