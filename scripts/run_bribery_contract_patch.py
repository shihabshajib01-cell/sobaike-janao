from pathlib import Path

path = Path('scripts/apply_bribery_contract.py')
source = path.read_text(encoding='utf-8')

old_first = "t = replace_exact(t, \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", \"  previousBillAmount?: number | string;\\n  briberyDepartment?: string;\\n  briberyService?: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", 'submitted bribery fields')"
new_first = "old = \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\"\nnew = \"  previousBillAmount?: number | string;\\n  briberyDepartment?: string;\\n  briberyService?: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\"\nif t.count(old) != 2: raise RuntimeError(f'submitted bribery fields: expected 2 shared anchors, found {t.count(old)}')\nt = t.replace(old, new, 1)"

old_second = "t = replace_exact(t, \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", \"  previousBillAmount?: number | string;\\n  briberyDepartment: string;\\n  briberyService: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\", 'draft bribery fields')"
new_second = "old = \"  previousBillAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\"\nnew = \"  previousBillAmount?: number | string;\\n  briberyDepartment: string;\\n  briberyService: string;\\n  briberyAmount?: number | string;\\n  frequency: 'one-time' | 'repeated';\"\nif t.count(old) != 1: raise RuntimeError(f'draft bribery fields: expected 1 remaining anchor, found {t.count(old)}')\nt = t.replace(old, new, 1)"

if source.count(old_first) != 1 or source.count(old_second) != 1:
    raise RuntimeError('Type patch wrapper guard failed')
source = source.replace(old_first, new_first).replace(old_second, new_second)

validation_guard = "'step3 bribery validation')"
if source.count(validation_guard) != 1:
    raise RuntimeError('Validation patch wrapper guard failed')
source = source.replace(validation_guard, "'step3 bribery validation', expected=2)", 1)

exec(compile(source, str(path), 'exec'), {'__name__': '__main__'})
