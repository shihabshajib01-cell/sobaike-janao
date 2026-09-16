from pathlib import Path

path = Path('scripts/apply_bribery_contract.py')
source = path.read_text(encoding='utf-8')

old_first = "t = replace_exact(t, \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", \"  previousBillAmount?: number | string;\\n  briberyDepartment?: string;\\n  briberyService?: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", 'submitted bribery fields')"
new_first = "t = replace_regex(t, r\"(export interface SubmittedReport \\\{.*?  previousBillAmount\\?: number \\| string;\\n)(  frequency: 'one-time' \\| 'repeated';)\", r\"\\1  briberyDepartment?: string;\\n  briberyService?: string;\\n  briberyAmount?: number | string;\\n\\2\", 'submitted bribery fields', flags=re.S)"

old_second = "t = replace_exact(t, \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", \"  previousBillAmount?: number | string;\\n  briberyDepartment: string;\\n  briberyService: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", 'draft bribery fields')"
new_second = "t = replace_regex(t, r\"(export interface DraftReport \\\{.*?  previousBillAmount\\?: number \\| string;\\n)(  frequency: 'one-time' \\| 'repeated';)\", r\"\\1  briberyDepartment: string;\\n  briberyService: string;\\n  briberyAmount?: number | string;\\n\\2\", 'draft bribery fields', flags=re.S)"

if source.count(old_first) != 1 or source.count(old_second) != 1:
    raise RuntimeError('Type patch wrapper guard failed')

source = source.replace(old_first, new_first).replace(old_second, new_second)
exec(compile(source, str(path), 'exec'), {'__name__': '__main__'})
