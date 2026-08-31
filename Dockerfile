# Imagem base oficial do Node.js LTS (leve e otimizada)
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências necessárias para o build
RUN npm install

# Copia todo o código fonte da aplicação
COPY . .

# Compila o frontend React com o Vite para a pasta dist
RUN npm run build

# Expõe a porta do servidor Express
EXPOSE 3001

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3001

# Comando de inicialização do servidor
CMD ["node", "api/index.js"]
