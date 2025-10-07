import { GoogleGenAI } from "@google/genai";
import * as fs from "fs";
import * as path from "path";

// DON'T DELETE THIS COMMENT - Using blueprint:javascript_gemini
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

interface FileContent {
  path: string;
  content: string;
}

function readFileSafely(filePath: string): string | null {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    return null;
  }
}

function collectProjectFiles(): FileContent[] {
  const files: FileContent[] = [];
  
  // Core configuration files
  const configFiles = [
    'package.json',
    'tsconfig.json',
    'vite.config.ts',
    'tailwind.config.ts',
    'drizzle.config.ts',
    'replit.md'
  ];
  
  for (const file of configFiles) {
    const content = readFileSafely(file);
    if (content) {
      files.push({ path: file, content });
    }
  }
  
  // Schema and types
  const schemaContent = readFileSafely('shared/schema.ts');
  if (schemaContent) {
    files.push({ path: 'shared/schema.ts', content: schemaContent });
  }
  
  // Main server files
  const serverFiles = [
    'server/index.ts',
    'server/routes.ts',
    'server/storage.ts',
    'server/resend.ts',
    'server/gmail.ts'
  ];
  
  for (const file of serverFiles) {
    const content = readFileSafely(file);
    if (content) {
      files.push({ path: file, content });
    }
  }
  
  // Key client files
  const clientFiles = [
    'client/src/App.tsx',
    'client/src/main.tsx',
    'client/src/lib/queryClient.ts'
  ];
  
  for (const file of clientFiles) {
    const content = readFileSafely(file);
    if (content) {
      files.push({ path: file, content });
    }
  }
  
  return files;
}

async function analyzeProject() {
  console.log("🔍 Iniciando análisis del proyecto con Gemini AI...\n");
  
  const projectFiles = collectProjectFiles();
  
  // Leer replit.md para contexto
  const replitMd = readFileSafely('replit.md') || '';
  const packageJson = readFileSafely('package.json') || '';
  
  const analysisPrompt = `Eres un arquitecto de software senior experto en TypeScript, React, Node.js, y bases de datos PostgreSQL.

Analiza este proyecto de gestión inmobiliaria llamado "HomesApp" basándote en su documentación y package.json.

DOCUMENTACIÓN DEL PROYECTO:
${replitMd}

DEPENDENCIAS:
${packageJson}

Proporciona un análisis enfocado en:

1. **ERRORES CRÍTICOS Y BUGS POTENCIALES** 🐛
   - Problemas de seguridad comunes en este tipo de aplicaciones
   - Vulnerabilidades en dependencias conocidas
   - Errores de configuración típicos

2. **MEJORAS DE ARQUITECTURA** 🏗️
   - Patrones de diseño que podrían mejorar el sistema
   - Escalabilidad del sistema actual
   - Separación de responsabilidades

3. **OPTIMIZACIONES DE RENDIMIENTO** ⚡
   - Optimizaciones de base de datos para un sistema multi-rol
   - Mejoras de caching
   - Bundle optimization

4. **MEJORES PRÁCTICAS** ✅
   - Seguridad en sistema multi-tenant
   - Manejo de roles y permisos
   - Testing strategy

5. **SUGERENCIAS ESPECÍFICAS** 💡
   - Funcionalidades que complementarían bien el sistema
   - Integraciones útiles basadas en el stack actual
   - Mejoras de UX/UI para roles específicos

Responde en español, sé específico y prioriza los problemas críticos primero.`;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: analysisPrompt,
      config: {
        temperature: 0.3,
        maxOutputTokens: 4000
      }
    });

    const analysis = response.text;
    
    console.log("✨ ANÁLISIS COMPLETO DE HOMESAPP ✨\n");
    console.log("=".repeat(80));
    console.log(analysis);
    console.log("=".repeat(80));
    
    // Guardar el análisis en un archivo
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const outputPath = `analysis-${timestamp}.md`;
    fs.writeFileSync(outputPath, `# Análisis de HomesApp\n\n${analysis}`, 'utf-8');
    console.log(`\n📄 Análisis guardado en: ${outputPath}`);
    
    return analysis;
  } catch (error) {
    console.error("❌ Error al analizar el proyecto:", error);
    throw error;
  }
}

// Ejecutar el análisis
analyzeProject().catch(console.error);
