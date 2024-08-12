```bash
# INIT GO MODULE
go mod init github.com/lucasbecker/go-react

# INIT TERN
tern init ./internal/store/pgstore/migrations

# CREATE MIGRATION
tern new --migrations ./internal/store/pgstore/migrations create-messages-table

# GENERATE CODE FROM SCHEMAS AND QUERIES
sqlc generate -f ./internal/store/pgstore/sqlc.yml

# ENSURE MODULES MATCHES SRC CODE AND ADD ANY MISSING MODULE
go mod tidy

# RUN
go run cmd/wsrs/main.go
```

## Instalando GO

A forma mais recomendada de obter o executável `go` utilizado para criar, executar e gerenciar projetos na linguagem é através do instalador oficial da linguagem ou do binário pré-compilado para seu sistema operacional

Caso Você ja tenha a ferramenta `go` disponível no seu terminal, confira se a versão é >=1.21.
Isso pode ser feito rodando o comando `go version`.

Você terá uma saída no seu prompt como esta:

```bash
$ go version
go version go1.22.2 darwin/arm64
```

Caso a versão da sua ferramenta `go` seja menor que a versão 1.21 Siga para a etapa de instalação abaixo.

abaixo.

## Linux/WSL

1. Baixe o binário mais recente para seu sistema operacional e arquitetura no site: https://go.dev/dl/

2. Remova qualquer instalação anterior de Go do seu sistema operacional deletando a pasta `/usr/local/go` (caso exista), então extraia o arquivo baixado para o caminho `/usr/local` criando uma instalação Go dentro de `/usr/local/go`

   ```bash
   $ rm -rf /usr/local/go; tar -C /usr/local -xzf go1.22.5.linux-amd64.tar.gz
   ```

3. Adicione o caminho `/usr/local/go/bin/` a sua variável de ambiente PATH colocando a seguinte linha em seu `.bashrc` `.profile` `.zshrc` `.zshenv`

   ```bash
   export PATH=$PATH:/usr/local/go/bin
   ```

4. Verifique que a instação foi concluída com sucesso rodando o comando:

   ```bash
   $ go version
   ```

5. Adicione também o seguinte caminho em seu PATH como feito anteriormente.

   ```bash
   export PATH=$PATH:~/go/bin
   ```

## MacOs

1. Baixe o binário mais recente para seu sistema operacional e arquitetura no site: https://go.dev/dl/

2. Abra o pacote (.pkg) e siga os passos do instalador automático.
3. Re-abra seu terminal
4. Verifique que a instação foi concluída com sucesso rodando o comando:

   ```bash
   $ go version
   ```

5. Adicione também o seguinte caminho em seu PATH

   ```bash
   export PATH=$PATH:~/go/bin
   ```

## Windows

Baixe o binário mais recente para seu sistema operacional e arquitetura no site: https://go.dev/dl/

Abra o pacote (.msi) e siga os passos do instalador automático.
feche TODOS os terminais abertos e re-abra seu terminal
Verifique que a instação foi concluída com sucesso rodando o comando:
$ go version
