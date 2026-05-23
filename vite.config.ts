import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const injectAgentHtmlPlugin = {
    name: 'inject-agent-html',
    closeBundle() {
      const src = path.resolve(__dirname, 'public/agent.html');
      const dest = path.resolve(__dirname, 'dist/agent.html');
      if (!fs.existsSync(src)) return;
      let content = fs.readFileSync(src, 'utf-8');
      content = content
        .replace('VITE_SUPABASE_URL_PLACEHOLDER', env.VITE_SUPABASE_URL || '')
        .replace('VITE_SUPABASE_ANON_KEY_PLACEHOLDER', env.VITE_SUPABASE_ANON_KEY || '');
      fs.writeFileSync(dest, content, 'utf-8');
    },
  };

  return {
    plugins: [react(), injectAgentHtmlPlugin],
    optimizeDeps: {
      exclude: ['lucide-react'],
    },
  };
});
