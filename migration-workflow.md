# Objective: Standalone Static Frontend Migration
You are operating in Google Antigravity. Your task is to decouple the existing full-stack React/Next.js application from its Express/PostgreSQL backend and transform it into a 100% standalone, client-side showcase using hardcoded JSON.

## 1. Required Artifacts (Planning Phase)
Before modifying any files, you must generate a detailed **Task List** and **Implementation Plan** artifact. The plan must outline exactly which backend calls will be removed and where the JSON mock data will be stored. Await my approval on these artifacts before executing code changes.

## 2. Core Migration Directives
- **Zero Backend Reliance:** Assume the `/server` and `/api` directories are deprecated. Do not execute, modify, or attempt to fix backend services.
- **Data Mocking Strategy:** Create static JSON files in `src/data/` (e.g., `mock_seismic_logs.json`, `mock_soil_data.json`, `mock_beacons.json`) that exactly mirror the old PostgreSQL schemas.
- **API Replacement:** Replace all `fetch()` or `axios` calls with direct imports of the local JSON files.
- **Simulate Real-time State:** For dynamic components like the seismic charts, implement lightweight frontend `setInterval` functions to randomly sample the JSON arrays, simulating live IoT ingestion without a real WebSocket/API connection.

## 3. Verification (Browser Subagent)
Once code modifications are complete, utilize the Browser Subagent to verify the frontend. Capture screenshots of the `RescueCoordinator` and `SeismicMode` dashboards to prove the UI remains visually identical to the production version and that no API fetch errors are present in the developer console.