import { siteConfig } from './config';
import fs from 'fs';
import path from 'path';
import { marked } from 'marked';

export type Post = {
  title: string;
  publishedAt: string;
  summary: string;
  author: string;
  slug: string;
  image?: string;
};

function parseFrontmatter(fileContent: string) {
  const frontmatterRegex = /---\s*([\s\S]*?)\s*---/;
  const match = frontmatterRegex.exec(fileContent);
  if (!match) {
    throw new Error('Frontmatter not found');
  }
  const frontMatterBlock = match[1];
  const content = fileContent.replace(frontmatterRegex, '').trim();
  const frontMatterLines = frontMatterBlock.trim().split('\n');
  const metadata: Partial<Post> = {};

  frontMatterLines.forEach((line) => {
    const [key, ...valueArr] = line.split(': ');
    let value = valueArr.join(': ').trim();
    value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
    metadata[key.trim() as keyof Post] = value;
  });

  return { data: metadata as Post, content };
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx');
}

export async function markdownToHTML(markdown: string): Promise<string> {
  return await marked(markdown);
}

export async function getPost(slug: string) {
  const filePath = path.join('content', `${slug}.mdx`);
  const source = fs.readFileSync(filePath, 'utf-8');
  const { content: rawContent, data: metadata } = parseFrontmatter(source);
  const content = await markdownToHTML(rawContent); // Await the result
  const defaultImage = `${siteConfig.url}/og?title=${encodeURIComponent(metadata.title)}`;
  return {
    source: content,
    metadata: {
      ...metadata,
      image: metadata.image || defaultImage,
    },
    slug,
  };
}

async function getAllPosts(dir: string) {
  const mdxFiles = getMDXFiles(dir);
  return Promise.all(
    mdxFiles.map(async (file) => {
      const slug = path.basename(file, path.extname(file));
      const { metadata, source } = await getPost(slug);
      return {
        ...metadata,
        slug,
        source,
      };
    })
  );
}

export async function getBlogPosts() {
  return getAllPosts(path.join(process.cwd(), 'content'));
}
