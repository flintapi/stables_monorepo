import { defineConfig, defineDocs } from 'fumadocs-mdx/config';
import { createGenerator, remarkAutoTypeTable } from "fumadocs-typescript"
import remarkDirectives from "remark-directive"

export const docs = defineDocs({
  dir: 'content/docs',
});

const generator = createGenerator();

export default defineConfig({
  mdxOptions: {
    remarkPlugins: [[remarkDirectives, remarkAutoTypeTable, { generator }]]
  }
});
