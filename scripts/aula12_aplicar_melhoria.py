from pathlib import Path
import sys

path = Path("web/src/App.tsx")
if not path.is_file():
    sys.exit("Arquivo web/src/App.tsx ausente. NÃO alterei arquivos; localize o componente CuratorLogin.")
s = path.read_text(encoding="utf-8")
start = s.find("function CuratorLogin(")
end = s.find("function Moderacao()", start)
if start < 0 or end < 0:
    sys.exit("Estrutura de CuratorLogin divergente. NÃO alterei arquivos.")
chunk = s[start:end]
old_error = "{error && <ErrorBox message={error} />}"
new_error = '{error && <div role="alert"><ErrorBox message={error} /></div>}'
old_form = '<form className="form-grid" onSubmit={validate}>'
new_form = '<form className="form-grid" onSubmit={validate} aria-busy={loading}>'
if chunk.count(old_error) != 1 or chunk.count(old_form) != 1:
    sys.exit("Formulário divergente ou já modificado. NÃO alterei arquivos; revise manualmente.")
changed = chunk.replace(old_error,new_error,1).replace(old_form,new_form,1)
path.write_text(s[:start]+changed+s[end:],encoding="utf-8")
print("Aplicada mudança de acessibilidade em web/src/App.tsx. Agora confira git diff e execute os testes.")
