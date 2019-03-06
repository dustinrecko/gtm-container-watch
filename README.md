# gtm-container-watch
Crawl GTM .js snippets from target websites, extract the data object and monitor changes by committing to the tracking branch.

# Run locally
1. Clone the repo
2. npm install
3. Modify config.json
4. Set GITHUB_AUTH env variable to your GitHub personal access token
5. node index.js

# Run as Google Cloud Function
1. Clone the repo and make it available in your GitHub account
2. Link your GitHub repo to Google Cloud Source
3. Modify config.json
4. Create a Google Cloud Function based on the Google Cloud Source repo and Pub/Sub as trigger, add your GitHub personal access token as env variable GITHUB_AUTH
5. Setup Google Cloud Scheduler to run the function as often as you want via Pub/Sub