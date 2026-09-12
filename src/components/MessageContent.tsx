"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChartBlock, type ChartSpec } from "./ChartBlock";

type ContentPart = { type: "markdown"; content: string } | { type: "chart"; spec: ChartSpec };

function parseContentParts(content: string): ContentPart[] {
  const parts: ContentPart[] = [];
  const chartRegex = /```chart\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = chartRegex.exec(content)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "markdown", content: content.slice(lastIndex, match.index) });
    }
    try {
      const spec = JSON.parse(match[1].trim()) as ChartSpec;
      parts.push({ type: "chart", spec });
    } catch {
      parts.push({ type: "markdown", content: match[0] });
    }
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < content.length) {
    parts.push({ type: "markdown", content: content.slice(lastIndex) });
  }

  return parts.length > 0 ? parts : [{ type: "markdown", content }];
}

const MARKDOWN_COMPONENTS = {
  table: ({ children }: { children?: React.ReactNode }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs rounded-oa-sm overflow-hidden border border-oa-line-soft">{children}</table>
    </div>
  ),
  thead: ({ children }: { children?: React.ReactNode }) => <thead className="bg-oa-surface-raise">{children}</thead>,
  th: ({ children }: { children?: React.ReactNode }) => (
    <th className="border-b border-oa-line px-3 py-2 text-left font-semibold whitespace-nowrap text-oa-text">{children}</th>
  ),
  td: ({ children }: { children?: React.ReactNode }) => (
    <td className="border-b border-oa-line-soft px-3 py-2 align-top text-oa-text-dim">{children}</td>
  ),
  p: ({ children }: { children?: React.ReactNode }) => <p className="my-1.5 last:mb-0">{children}</p>,
  ul: ({ children }: { children?: React.ReactNode }) => <ul className="list-disc pl-4 my-1.5 space-y-0.5">{children}</ul>,
  ol: ({ children }: { children?: React.ReactNode }) => <ol className="list-decimal pl-4 my-1.5 space-y-0.5">{children}</ol>,
  li: ({ children }: { children?: React.ReactNode }) => <li className="my-0">{children}</li>,
  strong: ({ children }: { children?: React.ReactNode }) => <strong className="font-semibold text-oa-text">{children}</strong>,
  code: ({ className, children }: { className?: string; children?: React.ReactNode }) => {
    const isBlock = /language-/.test(className ?? "");
    if (isBlock) {
      return (
        <pre className="my-2 bg-oa-bg border border-oa-line-soft rounded-oa-sm px-3 py-2 text-xs font-mono text-oa-text overflow-x-auto">
          <code>{children}</code>
        </pre>
      );
    }
    return <code className="bg-oa-bg border border-oa-line-soft rounded px-1.5 py-0.5 text-xs font-mono text-oa-gold">{children}</code>;
  },
  pre: ({ children }: { children?: React.ReactNode }) => <>{children}</>,
  h1: ({ children }: { children?: React.ReactNode }) => <h1 className="text-base font-bold mt-3 mb-1.5 text-oa-text">{children}</h1>,
  h2: ({ children }: { children?: React.ReactNode }) => <h2 className="text-sm font-bold mt-3 mb-1.5 text-oa-text">{children}</h2>,
  h3: ({ children }: { children?: React.ReactNode }) => <h3 className="text-sm font-semibold mt-2 mb-1 text-oa-text">{children}</h3>,
  blockquote: ({ children }: { children?: React.ReactNode }) => (
    <blockquote className="border-l-2 border-oa-gold/50 pl-3 text-oa-text-faint italic my-2">{children}</blockquote>
  ),
  hr: () => <hr className="border-oa-line-soft my-3" />,
};

export function MessageContent({ text }: { text: string }) {
  const parts = parseContentParts(text);
  return (
    <>
      {parts.map((part, i) =>
        part.type === "chart" ? (
          <ChartBlock key={i} spec={part.spec} />
        ) : (
          <ReactMarkdown key={i} remarkPlugins={[remarkGfm]} components={MARKDOWN_COMPONENTS}>
            {part.content}
          </ReactMarkdown>
        )
      )}
    </>
  );
}
