FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

ARG VITE_API_BASE_URL=/api
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL
RUN npm run build

FROM nginx:1.27-alpine AS runtime

COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Runtime user handling rationale:
# nginx binds to privileged port 80, so this image keeps the default master process
# startup behavior while nginx workers run as the standard unprivileged nginx user.
# Note: docker-compose.yml defines its own matching healthcheck which overrides this
# when running via compose. Keep both in sync.
HEALTHCHECK --interval=10s --timeout=5s --retries=3 --start-period=5s \
	CMD wget -qO /dev/null http://127.0.0.1:80/ || exit 1

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
