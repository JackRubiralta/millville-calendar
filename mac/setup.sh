#!/bin/bash
clear

# Checking for Node.js and npm and installing them if they are not present
if ! command -v node &> /dev/null || ! command -v npm &> /dev/null; then
    echo "Node.js or npm not found. Installing Node.js and npm..."
    # Check if Homebrew is installed and install it if necessary
    if ! command -v brew &> /dev/null; then
        echo "Homebrew not found. Installing Homebrew..."
        /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
    brew install node
else
    echo "Node.js and npm are already installed."
fi

cd "$(dirname "$0")"
cd ..
echo "Installing required npm packages..."
npm install

echo "Setup complete. Please restart your terminal for all changes to take effect."
read -p "Press any key to continue... " -n1 -s
echo
