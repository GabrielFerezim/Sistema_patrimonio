# Imagem base oficial do Node.js LTS (leve e otimizada)
FROM node:20-alpine

# Diretório de trabalho dentro do container
WORKDIR /app

# Argumentos de build para o frontend Vite
ARG VITE_ENTRA_CLIENT_ID=1e2dda32-51f3-42d1-8604-621a01ed4e3a
ARG VITE_ENTRA_TENANT_ID=e917adfc-3994-4381-9ab2-0c24c940c6fe
ENV VITE_ENTRA_CLIENT_ID=$VITE_ENTRA_CLIENT_ID
ENV VITE_ENTRA_TENANT_ID=$VITE_ENTRA_TENANT_ID

# Copia arquivos de dependências
COPY package*.json ./

# Instala todas as dependências necessárias para o build
RUN npm install --no-audit --prefer-offline

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
