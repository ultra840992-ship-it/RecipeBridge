import os
import subprocess

def run(cmd):
    print("Running:", cmd)
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.stderr:
        print("STDERR:", result.stderr)
    return result.stdout.strip()

os.environ["GIT_INDEX_FILE"] = ".git/temp_index_2"

bad_files = [
    "02_Wiki/Task_Status_Bitz_PR_Review_20260719.md -->",
    "02_Wiki/Weekly_Milestone_Report_Template.md -->",
    "02_Wiki/decisions/beta_tester_pain_index_survey_design.md -->",
    "02_Wiki/design/RecipeBridge_Wireframe_Specification_V1.0.md -->",
    "02_Wiki/dev-tasks/2024-XX-XX_notion-api-integration.md -->",
    "02_Wiki/projects/recipe_packs_micro_projects_v1.md -->",
    "02_Wiki/sources/platform_pre_registration_seo_strategy.md -->",
    "src/index.css *"
]

for bf in bad_files:
    run(f'git rm --cached "{bf}"')

tree = run("git write-tree")
print("Tree:", tree)
commit = run(f'git commit-tree {tree} -p origin/main -m "Remove invalid files created by agent"')
print("Commit:", commit)

if commit:
    run(f'git push origin {commit}:refs/heads/main')
