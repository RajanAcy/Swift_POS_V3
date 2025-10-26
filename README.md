<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Git Swift POS v3

This is a point-of-sale application built with React and TypeScript.

View your app in AI Studio: https://ai.studio/apps/drive/1lyQbHxiAUzkfXESXM5G33ZUyqwZXX7A9

## Single-File Version

The `packaged.html` file in the root of this project is a single, self-contained HTML file with all the necessary CSS and JavaScript inlined. You can open this file directly in your browser to run the application without needing a build step or a development server.

## Development

If you want to modify the application, you'll need to set up a development environment.

**Prerequisites:** Node.js

### Running the Development Server

1.  **Install Dependencies:**
    ```bash
    npm install
    ```

2.  **Set Environment Variables:**
    Create a `.env` file in the project root and add your Gemini API key:
    ```
    GEMINI_API_KEY=your_api_key_here
    ```

3.  **Start the Server:**
    ```bash
    npm run dev
    ```
    This will start the development server, typically at `http://localhost:3000`.

### Building the Single-File Version

To generate a new `packaged.html` from the source code, run the build command:

```bash
npm run build
```

This command will bundle the entire application and create a new `dist/index.html` file. This file is then moved to the project root as `packaged.html`.
