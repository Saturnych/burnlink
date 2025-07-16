# BurnLink - Share secrets & links securely

**BurnLink** is a privacy-focused web application designed for secrets or links encryption to share them securely.

## Key Features  
- ✅ **No Persistent Storage** – No backend or browser storage used for the secrets
- ✅ **Unique Links** – Generates encrypted URLs for secure access  
- ✅ **Modern Stack** – Powered by SvelteKit and Tailwind CSS, deployed on Vercel
- ✅ **End-to-End Testing** – Comprehensive browser testing using Playwright
- ✅ **CI/CD Pipeline** – GitHub workflows for testing and email notification if tests succeed
- ✅ **End-to-End Testing** – Comprehensive browser testing using Playwright

## Technical Implementation  
- **Frontend**: SvelteKit, Typescript, Tailwind CSS
- **Backend**: API based on SvelteKit and Typescript
- **Hosting**: Automatically deployed on Vercel
- **Testing**:
  - Playwright for end-to-end testing
  - GitHub Actions for automated test execution
- **Security**: Token-based API access control

## Development & CI/CD  
- **Vercel Hosting**: Automatic deployments from GitHub repository  
- **GitHub Workflows**:
  - Automated testing via GitHub Actions
  - Email notification after tests successfully passed
- **Playwright Test Suite**:  
  - Link generation validation  
  - Cross-browser compatibility
  - Backend API tests

[**Live Demo**](https://burnlink.ru){target="_blank"} | [**GitHub Repository**](https://github.com/Saturnych/burnlink)
