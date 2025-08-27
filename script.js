import { openaiConfig } from "https://cdn.jsdelivr.net/npm/bootstrap-llm-provider@1.2";

document.addEventListener('DOMContentLoaded', async () => {

    const { baseUrl, apiKey } = await openaiConfig({
        defaultBaseUrls: ["https://aipipe.org/openai/v1","https://llmfoundry.straive.com/openai/v1","https://api.openai.com/v1", "https://openrouter.com/api/v1"],
      });
    // Form elements
    const githubForm = document.getElementById('githubForm');
    const commitVerificationForm = document.getElementById('commitVerificationForm');
    
    // Section elements
    const repoForm = document.getElementById('repoForm');
    const loadingSection = document.getElementById('loadingSection');
    const analysisResults = document.getElementById('analysisResults');
    const commitForm = document.getElementById('commitForm');
    const verificationResults = document.getElementById('verificationResults');
    
    // Content elements
    const loadingMessage = document.getElementById('loadingMessage');
    const repoSummaryContent = document.getElementById('repoSummaryContent');
    const suggestedChangeContent = document.getElementById('suggestedChangeContent');
    const verificationContent = document.getElementById('verificationContent');
    
    // Store repository information
    let currentRepo = {
        owner: '',
        repo: '',
        token: '',
        files: []
    };
    
    // Check if token exists in localStorage and populate the field
    const savedToken = localStorage.getItem('githubToken');
    if (savedToken) {
        document.getElementById('githubToken').value = savedToken;
    }

    // Handle repository analysis form submission
    githubForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get form values
        const repoUrl = document.getElementById('repoUrl').value.trim();
        const githubToken = document.getElementById('githubToken').value.trim();
        
        // Validate and parse GitHub URL
        const repoInfo = parseGitHubUrl(repoUrl);
        if (!repoInfo) {
            alert('Invalid GitHub repository URL. Please use the format: https://github.com/username/repo');
            return;
        }
        
        // Store current repository information
        currentRepo.owner = repoInfo.owner;
        currentRepo.repo = repoInfo.repo;
        currentRepo.token = githubToken;
        
        // Save token to localStorage
        localStorage.setItem('githubToken', githubToken);
        
        // Show loading indicator
        repoForm.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        loadingMessage.textContent = 'Fetching repository files...';
        
        try {
            // Fetch repository files
            await fetchRepositoryFiles();
            
            // Analyze repository with LLM
            loadingMessage.textContent = 'Analyzing repository with AI...';
            const analysis = await analyzeRepositoryWithLLM();
            
            // Display analysis results
            repoSummaryContent.innerHTML = `<pre>${analysis.summary}</pre>`;
            suggestedChangeContent.innerHTML = `<pre>${analysis.suggestedChange}</pre>`;
            
            // Show analysis results and commit form
            loadingSection.classList.add('hidden');
            analysisResults.classList.remove('hidden');
            commitForm.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            loadingSection.classList.add('hidden');
            repoForm.classList.remove('hidden');
            alert(`Error: ${error.message || 'Failed to analyze repository'}`);
        }
    });
    
    // Handle commit verification form submission
    commitVerificationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Get commit URL
        const commitUrl = document.getElementById('commitUrl').value.trim();
        
        // Validate commit URL
        const commitInfo = parseCommitUrl(commitUrl);
        if (!commitInfo || commitInfo.owner !== currentRepo.owner || commitInfo.repo !== currentRepo.repo) {
            alert('Invalid commit URL or does not match the analyzed repository');
            return;
        }
        
        // Show loading indicator
        commitForm.classList.add('hidden');
        loadingSection.classList.remove('hidden');
        loadingMessage.textContent = 'Fetching commit changes...';
        
        try {
            // Fetch commit changes
            const commitChanges = await fetchCommitChanges(commitInfo.commitHash);
            
            // Verify changes with LLM
            loadingMessage.textContent = 'Verifying changes with AI...';
            const verification = await verifyChangesWithLLM(commitChanges);
            
            // Display verification results
            verificationContent.innerHTML = `<pre>${verification.result}</pre>`;
            
            // Show verification results
            loadingSection.classList.add('hidden');
            verificationResults.classList.remove('hidden');
        } catch (error) {
            console.error('Error:', error);
            loadingSection.classList.add('hidden');
            commitForm.classList.remove('hidden');
            alert(`Error: ${error.message || 'Failed to verify commit'}`);
        }
    });
    
    // Parse GitHub repository URL
    function parseGitHubUrl(url) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname !== 'github.com') {
                return null;
            }
            
            const pathParts = parsedUrl.pathname.split('/').filter(part => part);
            if (pathParts.length < 2) {
                return null;
            }
            
            return {
                owner: pathParts[0],
                repo: pathParts[1]
            };
        } catch (error) {
            return null;
        }
    }
    
    // Parse commit URL
    function parseCommitUrl(url) {
        try {
            const parsedUrl = new URL(url);
            if (parsedUrl.hostname !== 'github.com') {
                return null;
            }
            
            const pathParts = parsedUrl.pathname.split('/').filter(part => part);
            if (pathParts.length < 4 || pathParts[2] !== 'commit') {
                return null;
            }
            
            return {
                owner: pathParts[0],
                repo: pathParts[1],
                commitHash: pathParts[3]
            };
        } catch (error) {
            return null;
        }
    }
    
    // Fetch repository files recursively with depth limit
    async function fetchRepositoryFiles(path = '', depth = 0) {
        // Limit depth to 2 (main directory + 2 levels of subdirectories)
        const maxDepth = 2;
        if (depth > maxDepth) {
            return;
        }
        
        try {
            // Fetch directory contents
            const response = await fetch(`https://api.github.com/repos/${currentRepo.owner}/${currentRepo.repo}/contents/${path}`, {
                headers: {
                    'Authorization': `token ${currentRepo.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const contents = await response.json();
            
            // Process each item
            for (const item of contents) {
                if (item.type === 'file') {
                    // Skip binary files only
                    if (isBinaryFile(item.path)) {
                        continue;
                    }
                    
                    // Fetch file content
                    const fileResponse = await fetch(item.download_url);
                    if (!fileResponse.ok) {
                        continue;
                    }
                    
                    const content = await fileResponse.text();
                    currentRepo.files.push({
                        path: item.path,
                        content: content
                    });
                } else if (item.type === 'dir') {
                    // Recursively fetch directory contents with increased depth
                    await fetchRepositoryFiles(item.path, depth + 1);
                }
            }
        } catch (error) {
            console.error('Error fetching repository files:', error);
            throw new Error('Failed to fetch repository files');
        }
    }
    
    // Check if file should be skipped (binary, non-code, or in excluded directories)
    function isBinaryFile(filename) {
        // Binary and non-code file extensions to skip
        const skipExtensions = [
            // Binary files
            '.jpg', '.jpeg', '.png', '.gif', '.bmp', '.ico', '.svg',
            '.pdf', '.doc', '.docx', '.ppt', '.pptx', '.xls', '.xlsx',
            '.zip', '.tar', '.gz', '.rar', '.7z',
            '.exe', '.dll', '.so', '.dylib',
            '.ttf', '.otf', '.woff', '.woff2',
            '.mp3', '.mp4', '.avi', '.mov', '.wav',
            // Data files
            '.csv', '.tsv', '.json', '.xml', '.yaml', '.yml',
            '.db', '.sqlite', '.sqlite3', '.mdb',
            // Other non-code files
            '.log', '.lock', '.env', '.bak', '.tmp', '.temp',
            '.DS_Store', '.gitignore', '.gitattributes'
        ];
        
        // Check if file is in excluded directory
        const excludedDirs = ['node_modules', '__pycache__', 'dist', 'build', '.git', 'venv', 'env', '.venv', '.env'];
        const pathParts = filename.split('/');
        
        // Check if any part of the path matches excluded directories
        for (const part of pathParts) {
            if (excludedDirs.includes(part)) {
                return true; // Skip this file
            }
        }
        
        // Check file extension
        const extension = filename.substring(filename.lastIndexOf('.')).toLowerCase();
        return skipExtensions.includes(extension);
    }
    
    // Generic function for LLM API calls
    async function callLLM(systemPrompt, userPrompt) {
        try {
            const response = await fetch(`${baseUrl}/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${apiKey}`
                },
                body: JSON.stringify({
                    model: 'gpt-5-mini',
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ]
                })
            });
            
            if (!response.ok) {
                throw new Error(`LLM API error: ${response.status}`);
            }
            
            const result = await response.json();
            return result.choices[0].message.content;
        } catch (error) {
            console.error('Error calling LLM API:', error);
            throw new Error('Failed to get response from AI');
        }
    }
    
    // Analyze repository with LLM
    async function analyzeRepositoryWithLLM() {
        try {
            // Prepare repository data for LLM
            const repoData = {
                owner: currentRepo.owner,
                repo: currentRepo.repo,
                files: currentRepo.files.map(file => ({
                    path: file.path,
                    content: file.content
                }))
            };
            
            const systemPrompt = 'You are an expert code analysis assistant. Analyze these repository files and suggest one change to analyze the students understanding of the topic.';
            const userPrompt = `Analyze this GitHub repository and suggest one meaningful change or improvement. Repository: ${currentRepo.owner}/${currentRepo.repo}\n\nFiles:\n${JSON.stringify(repoData.files, null, 2)}`;
            
            const analysisText = await callLLM(systemPrompt, userPrompt);
            
            // Parse analysis text into summary and suggested change
            const parts = analysisText.split('Suggested Change:');
            return {
                summary: parts[0].trim(),
                suggestedChange: parts.length > 1 ? parts[1].trim() : 'No specific change suggested.'
            };
        } catch (error) {
            console.error('Error analyzing repository:', error);
            throw new Error('Failed to analyze repository with AI');
        }
    }
    
    // Fetch commit changes
    async function fetchCommitChanges(commitHash) {
        try {
            const response = await fetch(`https://api.github.com/repos/${currentRepo.owner}/${currentRepo.repo}/commits/${commitHash}`, {
                headers: {
                    'Authorization': `token ${currentRepo.token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            
            if (!response.ok) {
                throw new Error(`GitHub API error: ${response.status}`);
            }
            
            const commitData = await response.json();
            
            // Extract files changed in the commit
            const changedFiles = [];
            for (const file of commitData.files) {
                changedFiles.push({
                    filename: file.filename,
                    status: file.status,
                    additions: file.additions,
                    deletions: file.deletions,
                    patch: file.patch || ''
                });
            }
            
            return {
                commitHash: commitHash,
                message: commitData.commit.message,
                author: commitData.commit.author.name,
                date: commitData.commit.author.date,
                changedFiles: changedFiles
            };
        } catch (error) {
            console.error('Error fetching commit changes:', error);
            throw new Error('Failed to fetch commit changes');
        }
    }
    
    // Verify changes with LLM
    async function verifyChangesWithLLM(commitChanges) {
        try {
            const systemPrompt = 'You are a code review assistant. Verify if the changes made in the commit address the suggested improvement.';
            const userPrompt = `Verify if these commit changes address the suggested improvement for repository ${currentRepo.owner}/${currentRepo.repo}.\n\nSuggested Change: ${document.getElementById('suggestedChangeContent').textContent}\n\nCommit Changes:\n${JSON.stringify(commitChanges, null, 2)}`;
            
            const verificationResult = await callLLM(systemPrompt, userPrompt);
            
            return {
                result: verificationResult
            };
        } catch (error) {
            console.error('Error verifying changes:', error);
            throw new Error('Failed to verify changes with AI');
        }
    }
});
