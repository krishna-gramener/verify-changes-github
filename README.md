# CodeChallenge AI

An educational web application designed for students to receive personalized coding challenges based on their GitHub repositories. The app analyzes student code, generates appropriate challenges to test understanding, and verifies if the implemented solutions are correct with clear yes/no feedback.

## Features

- Analyze student GitHub repositories using AI
- Generate personalized coding challenges based on student code
- Verify if student solutions correctly address the challenges
- Provide clear feedback with yes/no assessment and color-coded explanation
- Save GitHub token locally for convenience
- Filter out binary and non-code files to focus on relevant code
- Limit directory traversal to 2 levels deep for efficient analysis

## Technical Implementation

- **Frontend**: HTML, JavaScript, and Bootstrap 5 for a clean, responsive UI
- **GitHub Integration**: Uses GitHub REST API v3 to fetch repository contents and commit details
- **AI Integration**: Connects to LLM API endpoints using OpenAI-compatible chat completions
- **Data Format**: Enforces JSON format for LLM responses to ensure structured data parsing
- **Token Storage**: Securely stores GitHub token in browser's localStorage

## Setup

1. Clone this repository
2. Open `index.html` in your web browser using a local server (e.g., `python -m http.server 8000`)
3. No API key configuration needed - the app uses an external LLM provider configuration module

## How to Use

1. Enter a GitHub repository URL and your GitHub personal access token
2. The app will fetch the repository files (up to 2 directory levels deep) and analyze them with AI
3. Review the repository summary and the suggested coding challenge
4. Implement the challenge in your repository and create a commit
5. Enter the commit URL in the app to verify your implementation
6. Receive clear yes/no feedback with explanation on whether your solution correctly addresses the challenge

## Requirements

- GitHub Personal Access Token with `repo` scope
- Modern web browser with JavaScript enabled
- Internet connection to access GitHub API and LLM services

## Technical Notes

- The app uses the `bootstrap-llm-provider` module to dynamically obtain API base URLs and keys
- Repository files are filtered to exclude binary files, images, and non-code files
- Directory traversal is limited to a depth of 2 to balance thoroughness and performance
- All operations run client-side with no server-side code required

## Technologies Used

- **HTML5**: Structure and content
- **JavaScript (ES6+)**: Core application logic
- **Bootstrap 5**: Responsive UI components and styling
- **GitHub REST API v3**: Repository and commit data retrieval
- **LLM API**: AI-powered code analysis and verification
- **LocalStorage API**: Client-side token persistence
- **Fetch API**: Asynchronous HTTP requests
- **JSON**: Data interchange format
- **bootstrap-llm-provider**: External module for LLM API configuration

## Note

This application requires API keys to function properly. Make sure to keep your API keys secure and never commit them to version control.
