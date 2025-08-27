# GitHub Repository Analyzer

A simple web application that analyzes GitHub repositories using AI, suggests improvements, and verifies user-implemented changes.

## Features

- Analyze GitHub repositories using AI
- Get suggestions for code improvements
- Verify your changes against the AI suggestions

## Setup

1. Clone this repository
2. Open `index.html` in your web browser
3. Replace `YOUR_OPENAI_API_KEY` in `app.js` with your actual OpenAI API key

## How to Use

1. Enter a GitHub repository URL and your GitHub personal access token
2. The app will fetch the repository files and analyze them with AI
3. Review the suggested changes
4. Implement the changes in your repository and create a commit
5. Enter the commit URL in the app to verify your changes

## Requirements

- GitHub Personal Access Token with `repo` scope
- OpenAI API Key

## Technologies Used

- HTML5
- JavaScript (ES6+)
- Bootstrap 5
- GitHub API
- OpenAI API

## Note

This application requires API keys to function properly. Make sure to keep your API keys secure and never commit them to version control.
