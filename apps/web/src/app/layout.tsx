import type { Metadata } from 'next';
import type { ReactNode } from 'react';
import Script from 'next/script';

import './globals.css';

export const metadata: Metadata = {
  title: 'SAWA RH',
  description: 'Modern HR web platform for CV banking and volunteer reviews.',
};

const stripExtensionAttrsScript = `(function(){var blockedNames=new Set(['bis_skin_checked','bis_register']);var blockedPrefixes=['bis_','__processed_'];var shouldRemove=function(name){return blockedNames.has(name)||blockedPrefixes.some(function(prefix){return name.indexOf(prefix)===0;});};var cleanElement=function(element){if(!element||typeof element.getAttributeNames!=='function'){return;}element.getAttributeNames().forEach(function(name){if(shouldRemove(name)){element.removeAttribute(name);}});};var cleanTree=function(root){if(!root){return;}cleanElement(root);if(typeof root.querySelectorAll==='function'){root.querySelectorAll('*').forEach(cleanElement);}};cleanTree(document.documentElement);var observer=new MutationObserver(function(mutations){mutations.forEach(function(mutation){if(mutation.type==='attributes'&&shouldRemove(mutation.attributeName||'')){cleanElement(mutation.target);}mutation.addedNodes.forEach(function(node){if(node&&node.nodeType===1){cleanTree(node);}});});});observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true});window.addEventListener('load',function(){observer.disconnect();},{once:true});})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html suppressHydrationWarning>
      <body suppressHydrationWarning>
        {process.env.NODE_ENV === 'development' ? (
          <Script id="strip-extension-attrs" strategy="beforeInteractive">
            {stripExtensionAttrsScript}
          </Script>
        ) : null}
        {children}
      </body>
    </html>
  );
}
