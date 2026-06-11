# Agent Guidelines & Hygiene Rules

This document outlines the strict ground rules and hygiene standards that ALL AI agents and subagents MUST adhere to when operating within this repository. 

**Failure to adhere to these rules is considered a critical failure in execution.**

## 1. Think in Edge Cases
Before introducing strict filters, RegEx matches, or search operators (such as `intitle:` or hardcoded DOM queries), you MUST evaluate how they behave in edge cases.
- What if the company name is a common noun or a first name? (e.g., "Tal" matching a person's first name).
- What if the data is null or undefined?
- Do not introduce "clever" constraints without verifying that they do not break valid use cases.

## 2. Respect Working Code
If you are asked to modify a core mechanism (like the search query, fallback logic, or database schema), you must understand how it behaved *before* your change. 
- Do not blindly strip out hardcoded values or fallbacks without ensuring the dynamic replacement logic is fully tested and wired up.
- If a system was "working better before", revert to the proven logic rather than trying to patch broken logic.

## 3. Do Not Rush to Victory
Agents are forbidden from claiming victory or marking a task as "done" just because the code compiles or the initial test passes.
- Thoroughly test the outcome against the user's explicit goals.
- If you are building a UI, verify that the state logic doesn't ignore user inputs (e.g., Quick Apply ignoring text boxes).
- Think beyond the immediate symptom and solve the root architectural problem.

## 4. Understand Before Acting
Do not execute modifying tool calls (editing files, running bash commands) until you have fully researched the problem.
- Read the relevant files.
- Run git logs if necessary to understand historical context.
- Ask the user clarifying questions if the requirement is ambiguous.

**By reading this file, you agree to these terms. Proceed with caution, deliberation, and thoroughness.**
