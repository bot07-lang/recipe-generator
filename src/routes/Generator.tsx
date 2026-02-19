import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import Editor from '@monaco-editor/react';
import jsPDF from 'jspdf';
import { supabase, Template } from '../supabase';
import Notification from '../components/Notification';

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: 1,
    name: 'Classic Recipe Card',
    html: `<!DOCTYPE html><html><head><style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; background: #f5f5f5; }
    .recipe-card { background: white; padding: 30px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
    .title { font-size: 32px; color: #e74c3c; border-bottom: 3px solid #e74c3c; padding-bottom: 10px; margin-bottom: 20px; }
    .description { font-size: 16px; color: #666; margin-bottom: 20px; line-height: 1.6; }
    .meta { display: flex; gap: 20px; margin: 20px 0; flex-wrap: wrap; }
    .meta span { background: #f8f9fa; padding: 8px 15px; border-radius: 20px; font-size: 14px; font-weight: 500; }
    .ingredients, .instructions { margin: 25px 0; }
    .ingredients h3, .instructions h3 { color: #333; margin-bottom: 15px; font-size: 20px; }
    .ingredients-list { list-style: none; padding: 0; }
    .ingredients-list li { margin-bottom: 8px; padding-left: 20px; position: relative; }
    .ingredients-list li:before { content: "• "; color: #e74c3c; font-weight: bold; position: absolute; left: 0; }
    .instructions-list { counter-reset: step-counter; list-style: none; padding: 0; }
    .instructions-list li { margin-bottom: 15px; padding-left: 40px; position: relative; counter-increment: step-counter; }
    .instructions-list li:before { content: counter(step-counter); position: absolute; left: 0; top: 0; background: #e74c3c; color: white; width: 25px; height: 25px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
    .recipe-image { width: 100%; max-width: 400px; height: 250px; object-fit: cover; border-radius: 10px; margin: 20px 0; }
    </style></head><body><div class="recipe-card">{{IMAGE}}<h1 class="title">{{TITLE}}</h1><p class="description">{{DESCRIPTION}}</p><div class="meta"><span>⏱️ {{COOK_TIME}} minutes</span><span>🍽️ {{SERVINGS}} servings</span><span>⭐ {{DIFFICULTY}}</span><span>🔥 {{CALORIES}} calories</span></div><div class="ingredients"><h3>Ingredients</h3>{{INGREDIENTS}}</div><div class="instructions"><h3>Instructions</h3>{{INSTRUCTIONS}}</div></div></body></html>`,
    preview_image_url: null,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_generated_html: null,
    last_generated_at: null
  },
  {
    id: 2,
    name: 'Nutritional Infographic Card',
    html: `<!DOCTYPE html><html><head><style>
    @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=Playfair+Display:wght@400;700&family=Inter:wght@300;400;500;600;700&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f5f5f5; padding: 40px 20px; display: flex; justify-content: center; align-items: center; min-height: 100vh; }
    .nutrition-card { background: white; width: 1200px; max-width: 100%; padding: 70px 90px; position: relative; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
    .card-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 60px; }
    .card-title { font-family: 'Cormorant Garamond', 'Playfair Display', serif; font-size: 78px; font-weight: 700; color: #1a1a1a; letter-spacing: -0.5px; line-height: 1; font-style: normal; flex: 1; }
    .serving-size { font-family: 'Inter', sans-serif; font-size: 16px; color: #666; font-weight: 400; text-transform: lowercase; margin-left: 40px; padding-top: 8px; white-space: nowrap; }
    .card-content { display: flex; align-items: flex-start; margin-bottom: 50px; position: relative; }
    .image-section { flex: 0 0 500px; position: relative; padding-right: 60px; }
    .nutrition-image { width: 100%; height: 500px; object-fit: cover; border-radius: 12px; }
    .divider { position: absolute; left: 500px; top: 0; bottom: 0; width: 1px; background: #e0e0e0; }
    .facts-section { flex: 1; display: flex; flex-direction: column; gap: 45px; padding-left: 60px; padding-top: 10px; }
    .fact-item { display: flex; flex-direction: column; gap: 10px; }
    .fact-value { font-family: 'Inter', sans-serif; font-size: 68px; font-weight: 700; color: #1a1a1a; line-height: 1; letter-spacing: -3px; }
    .fact-description { font-family: 'Inter', sans-serif; font-size: 15px; color: #666; line-height: 1.5; font-weight: 400; }
    .card-statement { text-align: center; font-family: 'Inter', sans-serif; font-size: 18px; font-weight: 700; color: #1a1a1a; text-transform: uppercase; letter-spacing: 1.2px; margin-top: 50px; padding-top: 40px; border-top: 1px solid #e0e0e0; line-height: 1.4; }
    </style></head><body><div class="nutrition-card"><div class="card-header"><h1 class="card-title">{{TITLE}}</h1><div class="serving-size">{{SERVING_SIZE}}</div></div><div class="card-content"><div class="image-section"><img src="{{IMAGE}}" class="nutrition-image" alt="{{TITLE}}" /></div><div class="divider"></div><div class="facts-section"><div class="fact-item"><div class="fact-value">{{NUTRITION_PROTEIN_VALUE}}</div><div class="fact-description">{{NUTRITION_PROTEIN_DESC}}</div></div><div class="fact-item"><div class="fact-value">{{NUTRITION_FAT_VALUE}}</div><div class="fact-description">{{NUTRITION_FAT_DESC}}</div></div><div class="fact-item"><div class="fact-value">{{NUTRITION_CHOLESTEROL_VALUE}}</div><div class="fact-description">{{NUTRITION_CHOLESTEROL_DESC}}</div></div><div class="fact-item"><div class="fact-value">{{NUTRITION_CARBS_VALUE}}</div><div class="fact-description">{{NUTRITION_CARBS_DESC}}</div></div></div></div><div class="card-statement">{{NUTRITION_STATEMENT}}</div></div></body></html>`,
    preview_image_url: null,
    created_by: 'system',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    last_generated_html: null,
    last_generated_at: null
  },
];

function getFieldBlock(text: string, label: string): string {
  // For Total Duration, handle specially to avoid double-escaping issues
  // Also accept "Total Time" as an alternative
  if (label.includes('Total Duration') || label.includes('Total Time')) {
    // Match "Total Duration (Minutes):", "Total Duration:", "Total Time (Minutes):", or "Total Time:" followed by value on same line (spaces and Minutes optional)
    const patterns = [
      `Total\\s*Duration\\s*(?:\\(Minutes\\))?\\s*:\\s*([^\\n]+)`,
      `Total\\s*Time\\s*(?:\\(Minutes\\))?\\s*:\\s*([^\\n]+)`
    ];
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }
  
  // For Preparation Time, handle specially to avoid lookahead issues
  if (label.includes('Preparation Time')) {
    // Match "Preparation Time (Minutes):" or "Preparation Time:" followed by value on same line (spaces and Minutes optional)
    const re = new RegExp(`Preparation\\s*Time\\s*(?:\\(Minutes\\))?\\s*:\\s*([^\\n]+)`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }
  
  // For Recipe Title, try both "Recipe Title" and "Title"
  if (label.includes('Recipe Title')) {
    const patterns = [
      `Recipe\\s*Title\\s*:\\s*([^\\n]+)`,
      `Title\\s*:\\s*([^\\n]+)`
    ];
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }
  
  // For Recipe Description, try both "Recipe Description" and "Description"
  if (label.includes('Recipe Description')) {
    const lookaheadPattern = '(Recipe |Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
    const patterns = [
      `Recipe\\s*Description\\s*:\\s*([\\s\\S]*?)(?=\\n(?:Recipe |Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###)|\\n###|$)`,
      `Description\\s*:\\s*([\\s\\S]*?)(?=\\n(?:Recipe |Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###)|\\n###|$)`
    ];
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }
  
  // For Difficulty Level, try both "Difficulty Level" and "Level"
  if (label.includes('Difficulty Level')) {
    const lookaheadPattern = '(Recipe |Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
    const patterns = [
      `Difficulty\\s*Level\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`,
      `Level\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`
    ];
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }
  
  // For Serving Size, handle specially
  if (label.includes('Serving Size')) {
    const lookaheadPattern = '(Recipe |Serving\\s+Size|Nutrition\\s+Statement|Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
    const re = new RegExp(`Serving\\s*Size\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }
  
  // For Nutrition Statement, handle specially
  if (label.includes('Nutrition Statement')) {
    const lookaheadPattern = '(Recipe |Serving\\s+Size|Nutrition\\s+Statement|Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
    const re = new RegExp(`Nutrition\\s*Statement\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`, "i");
    const m = text.match(re);
    return m ? m[1].trim() : "";
  }
  
  // For No. of Servings, try "No. of Servings", "Servings", and "Serving" (singular)
  if (label.includes('No\\. of Servings') || label.includes('Servings') || label.includes('Serving')) {
    const lookaheadPattern = '(Recipe |Serving\\s+Size|Nutrition\\s+Statement|Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
    const patterns = [
      `No\\.\\s*of\\s*Servings?\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`,
      `Servings\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`,
      `Serving\\s*:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`
    ];
    for (const pattern of patterns) {
      const re = new RegExp(pattern, "i");
      const m = text.match(re);
      if (m) return m[1].trim();
    }
    return "";
  }
  
  // For other fields, escape special regex chars in label
  const escapedLabel = label.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  // Updated lookahead to match complete field names, not partial matches
  const lookaheadPattern = '(Recipe |Serving\\s+Size|Nutrition\\s+Statement|Difficulty|No\\.|Preparation\\s+Time|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|Website|###|$)';
  const re = new RegExp(`${escapedLabel}:\\s*([\\s\\S]*?)(?=\\n${lookaheadPattern})`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function getSection(text: string, keyword: string): string {
  // Handle both formats: ### Ingredients and ### :emoji: Ingredients
  // Match ### followed by optional emoji/prefix, then keyword, then capture content until next ### or end
  const lines = text.split('\n');
  let inSection = false;
  let content: string[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // Check if this line starts a section with our keyword
    if (/^###\s*.*?ingredients/i.test(line) && keyword.toLowerCase() === 'ingredients') {
      inSection = true;
      continue;
    }
    if (/^###\s*.*?instructions/i.test(line) && keyword.toLowerCase() === 'instructions') {
      inSection = true;
      continue;
    }
    if (/^###\s*.*?equipment/i.test(line) && keyword.toLowerCase() === 'equipment') {
      inSection = true;
      continue;
    }
    if (/^###\s*.*?nutrition/i.test(line) && keyword.toLowerCase() === 'nutrition') {
      inSection = true;
      continue;
    }
    
    // If we're in the section and hit another ###, stop
    if (inSection && /^###/.test(line)) {
      break;
    }
    
    // Collect content while in section
    if (inSection) {
      content.push(line);
    }
  }
  
  return content.join('\n').trim();
}

function cleanIngredients(text = ""): string[] {
  let t = text.replace(/^\s*•\s*/, "");
  
  // Remove "Ingredient Title: ..." lines (can appear multiple times)
  t = t.replace(/^Ingredient\s*Title\s*:.*$/gim, "");
  
  // Remove "Ingredients:" label if present
  t = t.replace(/^Ingredients\s*:\s*/gim, "").trim();
  
  // Split by lines - each line is one ingredient (don't split by commas)
  // This preserves ingredients like "5 ripe bananas, mashed" as a single ingredient
  const lines = t.split('\n').map(line => line.trim()).filter(Boolean);
  
  return lines;
}

function cleanDirections(text = ""): string[] {
  // Remove "Instructions Section Title: ..." lines
  let t = text.replace(/^Instructions\s*Section\s*Title\s*:.*$/gim, "");
  
  // Remove "Instructions:" label if present
  t = t.replace(/^Instructions\s*:\s*/gim, "").trim();

  // normalize any existing multiple newlines to one
  t = t.replace(/\n{2,}/g, "\n");

  // if the text is all in one line, add newlines before step numbers
  if (!t.includes("\n")) {
    t = t.replace(/\s*(?=(\d+\.\s))/g, "\n");
  }

  // ensure only single newlines remain
  t = t.replace(/\n{2,}/g, "\n").trim();

  // Split by lines and remove numbering
  const parts = t.split('\n')
    .map(s => s.replace(/^\d+\.\s*/, '').trim())
    .filter(Boolean);

  return parts;
}

function stripLabel(text = "", labelRegex: RegExp): string {
  return text.replace(labelRegex, "").trim();
}

// Parse nutrition section into structured key-value pairs
// Format: "Protein: 94-96% Protein rich intake Calories"
// Format: "Protein: ~18-20g (about 80% of total calories come from protein). Cod is a lean protein source."
// Returns: { Protein: { value: "94-96%", description: "Protein rich intake Calories" }, ... }
function parseNutritionFacts(nutritionText: string): Record<string, { value: string; description: string }> {
  const facts: Record<string, { value: string; description: string }> = {};
  if (!nutritionText) return facts;
  
  // Split by lines and parse each line
  const lines = nutritionText.split('\n').map(line => line.trim()).filter(Boolean);
  
  for (const line of lines) {
    // Match pattern: "Key: value description" or "Key: value"
    // Examples: "Protein: 94-96% Protein rich intake Calories"
    //           "Fat: 4-6% of Fat calories"
    //           "Protein: ~18-20g (about 80% of total calories come from protein). Cod is a lean protein source."
    //           "Cholesterol: 15%"
    const match = line.match(/^([^:]+):\s*(.+)$/);
    if (match) {
      const key = match[1].trim();
      const rest = match[2].trim();
      
      // Try to extract value - flexible pattern that handles:
      // - Tildes: ~
      // - Numbers and ranges: 18-20, 0.7, 94-96
      // - Units: g, mg, %, etc.
      // Examples: "~18-20g (description)", "~0.7g description", "94-96% description", "15%", "0%"
      // Match: optional ~, then numbers/dots/dashes, then optional unit (g, mg, %), stop at space
      const valueMatch = rest.match(/^(~?[\d\-\.]+(?:[\-][\d\-\.]+)?[%a-zA-Z]*?)\s/);
      if (valueMatch) {
        const value = valueMatch[1].trim();
        // Get everything after the value and space as description
        const description = rest.substring(valueMatch[0].length).trim();
        facts[key] = { value, description };
      } else {
        // No space after value - check if it ends with % or unit, or is just a number
        // If it looks like just a value (ends with % or unit, or is all numbers), use it as value
        if (rest.match(/^~?[\d\-\.]+[%a-zA-Z]*$/)) {
          facts[key] = { value: rest, description: '' };
        } else {
          // Try to split at first space or parenthesis
          const splitMatch = rest.match(/^(~?[\d\-\.]+(?:[\-][\d\-\.]+)?[%a-zA-Z]*?)([\(\)].*|$)/);
          if (splitMatch && splitMatch[1]) {
            facts[key] = { value: splitMatch[1].trim(), description: (splitMatch[2] || '').trim() };
          } else {
            // Use entire rest as value if we can't parse it
            facts[key] = { value: rest, description: '' };
          }
        }
      }
    }
  }
  
  return facts;
}

function parseRecipeData(t: string) {
  if (typeof t !== "string" || !t.trim()) return {};

  const title       = getFieldBlock(t, "Recipe Title");
  const description = getFieldBlock(t, "Recipe Description");
  const difficulty  = getFieldBlock(t, "Difficulty Level");
  const servings    = getFieldBlock(t, "No\\. of Servings") || getFieldBlock(t, "Servings") || getFieldBlock(t, "Serving");
  const prep        = getFieldBlock(t, "Preparation Time \\(Minutes\\)");
  const cook        = getFieldBlock(t, "Cooking Time \\(Minutes\\)");
  const rest        = getFieldBlock(t, "Rest Time \\(Minutes\\)");
  const total       = getFieldBlock(t, "Total Duration \\(Minutes\\)") || getFieldBlock(t, "Total Time \\(Minutes\\)") || getFieldBlock(t, "Total Time");
  const temp        = getFieldBlock(t, "Cooking Temp \\([^)]*\\)");
  let calories      = getFieldBlock(t, "Calories");
  const season      = getFieldBlock(t, "Best Season");
  const website     = getFieldBlock(t, "Website");
  const servingSize  = getFieldBlock(t, "Serving Size");
  const nutritionStatement = getFieldBlock(t, "Nutrition Statement");

  calories = calories.replace(/\bper\s*serving\b/i, "").trim();

  // Get raw sections
  const ingredientsRaw = getSection(t, "Ingredients");
  const instructionsRaw = getSection(t, "Instructions");
  const equipmentRaw = getSection(t, "Equipment");
  const nutritionRaw = getSection(t, "Nutrition");

  // Clean the sections using your functions
  const ingredients = cleanIngredients(ingredientsRaw);
  const instructions = cleanDirections(instructionsRaw);
  const equipment = stripLabel(equipmentRaw, /^Equipment\s*:\s*/i);
  const nutrition = stripLabel(nutritionRaw, /^Nutrition(?:\s*Facts)?\s*:\s*/i);
  
  // Parse nutrition into structured facts
  const nutritionFacts = parseNutritionFacts(nutrition);

  return {
    title: title || "Untitled Recipe",
    description,
    difficulty,
    servings: servings || "", // No default - empty if not provided
    prep_time_min: prep,
    cook_time_min: cook,
    rest_time_min: rest,
    total_time_min: total,
    temperature: temp,
    calories,
    season,
    website,
    serving_size: servingSize,
    nutrition_statement: nutritionStatement,
    ingredients, // Array of clean ingredients
    instructions, // Array of clean instructions
    equipment,
    nutrition,
    nutrition_facts: nutritionFacts // Structured nutrition data
  };
}

const ingredientsHtml = (arr?: string[]) => arr?.length ? `<ul class="ingredients-list">${arr.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
const instructionsHtml = (arr?: string[]) => arr?.length ? `<ul class="instructions-list">${arr.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
const itemsOnlyHtml = (arr?: string[]) => arr?.length ? arr.map(i => `<li>${i}</li>`).join('') : '';

// Helper to get nutrition fact value/description (case-insensitive key matching)
function getNutritionFact(data: Record<string, any>, key: string, type: 'value' | 'description' = 'value'): string {
  if (!data.nutrition_facts || typeof data.nutrition_facts !== 'object') return '';
  
  // Try exact match first
  let fact = data.nutrition_facts[key];
  
  // If no exact match, try case-insensitive search
  if (!fact) {
    const lowerKey = key.toLowerCase();
    for (const [factKey, factValue] of Object.entries(data.nutrition_facts)) {
      if (factKey.toLowerCase() === lowerKey) {
        fact = factValue;
        break;
      }
    }
  }
  
  if (!fact) return '';
  return type === 'value' ? fact.value : fact.description;
}

// Replace any placeholders found in the html with data keys (case-insensitive)
function fillPlaceholders(templateHtml: string, data: Record<string, any>, imageSrc: string | null, logoSrc?: string | null): string {
  let html = templateHtml;

  // Detect if placeholders are inside developer-provided UL/OL wrappers
  const isInsideList = (key: string) => {
    const re = new RegExp(`<\s*(ul|ol)[^>]*>[\\s\\S]*?(\\{\\{\\s*${key}\\s*\\}\\}|\\[\\s*${key}\\s*\\])[\\s\\S]*?<\\/\\1>`, 'i');
    return re.test(templateHtml);
  };

  const ingredientsInsideList = isInsideList('INGREDIENTS');
  const instructionsInsideList = isInsideList('INSTRUCTIONS');

  const map: Record<string, string> = {
    TITLE: data.title || '',
    DESCRIPTION: data.description || '',
    COOK_TIME: data.total_time_min || data.cook_time_min || '', // Show Total Duration, fallback to Cooking Time
    TIME: data.total_time_min || data.cook_time_min || '', // Alternative key - Show Total Duration, fallback to Cooking Time
    PREP_TIME: data.prep_time_min || '', // Shows Preparation Time (Minutes)
    PREPARATION_TIME: data.prep_time_min || '', // Alternative key - Shows Preparation Time (Minutes)
    REST_TIME: data.rest_time_min || '',
    TOTAL_DURATION: data.total_time_min || '',
    TOTAL_TIME: data.total_time_min || '',
    SERVINGS: data.servings || '',
    DIFFICULTY: data.difficulty || '',
    CALORIES: data.calories || '',
    RATING: data.rating || '5', // Default rating
    WEBSITE: data.website || '',
    SERVING_SIZE: data.serving_size || '',
    NUTRITION_STATEMENT: data.nutrition_statement || '',
    STATEMENT: data.nutrition_statement || '', // Alternative key
    // If developer provided UL/OL around the placeholder, output only <li> items
    // Otherwise, output our full list markup with default classes
    INGREDIENTS: ingredientsInsideList ? itemsOnlyHtml(data.ingredients) : ingredientsHtml(data.ingredients),
    INSTRUCTIONS: instructionsInsideList ? itemsOnlyHtml(data.instructions) : instructionsHtml(data.instructions),
    DIRECTIONS: instructionsInsideList ? itemsOnlyHtml(data.instructions) : instructionsHtml(data.instructions), // Alternative key
    IMAGE: imageSrc || '',
    IMAGE_URL: imageSrc || '',
    LOGO: logoSrc || '',
    LOGO_URL: logoSrc || '',
    NOTES: data.notes || data.description || '',
    // Nutrition facts - common keys
    NUTRITION_PROTEIN_VALUE: getNutritionFact(data, 'Protein', 'value'),
    NUTRITION_PROTEIN_DESC: getNutritionFact(data, 'Protein', 'description'),
    NUTRITION_FAT_VALUE: getNutritionFact(data, 'Fat', 'value'),
    NUTRITION_FAT_DESC: getNutritionFact(data, 'Fat', 'description'),
    NUTRITION_CHOLESTEROL_VALUE: getNutritionFact(data, 'Cholesterol', 'value'),
    NUTRITION_CHOLESTEROL_DESC: getNutritionFact(data, 'Cholesterol', 'description'),
    NUTRITION_CARBS_VALUE: getNutritionFact(data, 'Carbs', 'value'),
    NUTRITION_CARBS_DESC: getNutritionFact(data, 'Carbs', 'description'),
    NUTRITION_CARBOHYDRATES_VALUE: getNutritionFact(data, 'Carbohydrates', 'value'),
    NUTRITION_CARBOHYDRATES_DESC: getNutritionFact(data, 'Carbohydrates', 'description'),
    NUTRITION_FIBER_VALUE: getNutritionFact(data, 'Fiber', 'value'),
    NUTRITION_FIBER_DESC: getNutritionFact(data, 'Fiber', 'description'),
    NUTRITION_SODIUM_VALUE: getNutritionFact(data, 'Sodium', 'value'),
    NUTRITION_SODIUM_DESC: getNutritionFact(data, 'Sodium', 'description')
  };
  
  // Replace {{KEY}} placeholders
  html = html.replace(/\{\{\s*([A-Z_]+)\s*\}\}/gi, (_m, keyRaw) => {
    const key = String(keyRaw).toUpperCase();
    return key in map ? map[key] : '';
  });
  
  // Replace [KEY] placeholders (square brackets)
  html = html.replace(/\[\s*([A-Z_\s]+)\s*\]/gi, (_m, keyRaw) => {
    const key = String(keyRaw).replace(/\s+/g, '_').toUpperCase();
    return key in map ? map[key] : '';
  });
  
  // Handle individual ingredient placeholders [INGREDIENT 1], [INGREDIENT 2], etc.
  html = html.replace(/\[\s*INGREDIENT\s+(\d+)\s*\]/gi, (_m, num) => {
    const index = parseInt(num) - 1;
    return data.ingredients && data.ingredients[index] ? data.ingredients[index] : '';
  });
  
  // Handle individual step placeholders [STEP 1], [STEP 2], etc.
  html = html.replace(/\[\s*STEP\s+(\d+)\s*\]/gi, (_m, num) => {
    const index = parseInt(num) - 1;
    return data.instructions && data.instructions[index] ? data.instructions[index] : '';
  });
  
  // Handle nutrition fact placeholders with dynamic keys
  // Format: {{NUTRITION_[KEY]_VALUE}} or {{NUTRITION_[KEY]_DESC}}
  html = html.replace(/\{\{\s*NUTRITION_([A-Z_]+)_(VALUE|DESC)\s*\}\}/gi, (_m, keyRaw, type) => {
    const key = keyRaw.replace(/_/g, ' ');
    return getNutritionFact(data, key, type.toLowerCase() as 'value' | 'description');
  });
  
  // Note: intentionally NOT replacing standalone ALL-CAPS words without delimiters
  // to avoid clobbering normal text like headings (e.g., "Ingredients", "Instructions").
  // Use {{KEY}} or [KEY] placeholders instead.
  
  return html;
}

export default function Generator() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const recipeCardSample = `Recipe Title: Delicious Banana Cake
Recipe Description: A moist and flavorful banana cake that's perfect for any occasion.
Difficulty Level: Easy
No. of Servings: 8-10
Cooking Time (Minutes): 45
Calories: 320 per serving

### Ingredients
5 ripe bananas, mashed
2 cups all-purpose flour
1 cup granulated sugar
3 large eggs
1/2 cup vegetable oil

### Instructions
1. Preheat oven to 350°F (175°C). Grease a 9x13 inch baking pan.
2. Mix wet ingredients and sugars.
3. Combine with dry ingredients and bake 40-45 minutes.`;

  const nutritionCardSample = `Recipe Title: TUNA STEAK
Serving Size: per 100 grams
Nutrition Statement: TUNA IS NATURALLY CARB-FREE AND HAS A 0% GLYCEMIC INDEX.

### Nutrition
Protein: 94-96% Protein rich intake Calories
Fat: 4-6% of Fat calories
Cholesterol: 15%
Carbs: 0% A fresh tuna steak is a protein powerhouse that contains 0% carbohydrates`;

  const [raw, setRaw] = useState(recipeCardSample);
  const [img, setImg] = useState<string | null>(null);
  const [logoImg, setLogoImg] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTemplateHtml, setEditingTemplateHtml] = useState('');
  const [editingTemplateName, setEditingTemplateName] = useState('');
  const [editingPreviewImage, setEditingPreviewImage] = useState<string | null>(null);
  const [editingPreviewImageFile, setEditingPreviewImageFile] = useState<File | null>(null);
  const [isSavingTemplate, setIsSavingTemplate] = useState(false);
  const [showConfirmSave, setShowConfirmSave] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  // Input normalization: accept with or without ### section headers
  const selected = useMemo(() => {
    if (templateName) {
      return templates.find(t => t.name === templateName) || null;
    }
    return templates.find(t => t.id === templateId) || null;
  }, [templates, templateId, templateName]);
  const getPreviewUrl = (template: Template) => {
    // If template has preview_image_url from Supabase, use it
    if (template.preview_image_url) {
      return template.preview_image_url;
    }
    // For Classic Recipe Card, use the uploaded image
    if (template.name === 'Classic Recipe Card') {
      return 'https://vfckdxjhogghrpywyrjo.supabase.co/storage/v1/object/public/template-previews/classic-recipe-card.png';
    }
    // Fall back to placeholder
    return '/placeholder.jpg';
  };

  function extractSupabaseStoragePath(url: string | null): { bucket: string; path: string } | null {
    if (!url) return null;
    try {
      const u = new URL(url);
      // Supported patterns: public, sign, or direct object
      const parts = u.pathname.split('/');
      const idxPublic = parts.findIndex(p => p === 'public');
      const idxSign = parts.findIndex(p => p === 'sign');
      let bucket = '';
      let path = '';
      if (idxPublic >= 0 && parts[idxPublic + 1]) {
        bucket = parts[idxPublic + 1];
        path = parts.slice(idxPublic + 2).join('/');
      } else if (idxSign >= 0 && parts[idxSign + 1]) {
        bucket = parts[idxSign + 1];
        path = parts.slice(idxSign + 2).join('/');
      } else {
        const idxObj = parts.findIndex(p => p === 'object');
        if (idxObj >= 0 && parts[idxObj + 1]) {
          bucket = parts[idxObj + 1];
          path = parts.slice(idxObj + 2).join('/');
        }
      }
      if (bucket && path) {
        path = decodeURIComponent(path.replace(/^\//, ''));
        return { bucket, path };
      }
    } catch { /* ignore */ }
    return null;
  }


  useEffect(() => {
    loadTemplates();
    
    // Reload templates when page becomes visible after being hidden
    // (helps when new templates are added in Developer page)
    let wasHidden = document.hidden;
    const handleVisibilityChange = () => {
      if (wasHidden && !document.hidden) {
        // Page was hidden and now visible - reload templates
        loadTemplates();
      }
      wasHidden = document.hidden;
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  // Update sample content when template changes
  useEffect(() => {
    if (!selected) return;
    
    // Check if it's a nutritional card template
    const isNutritionCard = selected.name.toLowerCase().includes('nutrition') || 
                           selected.name.toLowerCase().includes('nutritional') ||
                           selected.id === 2; // Default nutritional card template ID
    
    // Only update if content matches the other template's sample (user hasn't customized it)
    // This prevents overwriting user's custom content
    const currentIsRecipeSample = raw === recipeCardSample;
    const currentIsNutritionSample = raw === nutritionCardSample;
    const isEmpty = raw.trim() === '';
    
    if (isNutritionCard && (currentIsRecipeSample || isEmpty)) {
      setRaw(nutritionCardSample);
    } else if (!isNutritionCard && (currentIsNutritionSample || isEmpty)) {
      setRaw(recipeCardSample);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected?.id, selected?.name, templateName, templateId]);

  async function loadTemplates() {
    try {
      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading templates:', error);
        setTemplates(DEFAULT_TEMPLATES);
        return;
      }

      if (data && data.length > 0) {
        setTemplates(data);
      } else {
        // If no templates in database, use defaults and insert them
        setTemplates(DEFAULT_TEMPLATES);
        await insertDefaultTemplates();
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      setTemplates(DEFAULT_TEMPLATES);
    }
  }

  async function insertDefaultTemplates() {
    try {
      const { error } = await supabase
        .from('templates')
        .insert(DEFAULT_TEMPLATES);

      if (error) {
        console.error('Error inserting default templates:', error);
      }
    } catch (error) {
      console.error('Error inserting default templates:', error);
    }
  }

  // Light normalizer that only runs in test mode to add missing headers
  function normalizeForFlex(text: string): string {
    let out = text;
    // Convert # or ### to our expected ### form (handles emoji prefixes like :carrot:, :book:)
    // Pattern: ### followed by any characters (including emojis), then keyword
    out = out.replace(/^\s*#{1,3}\s*.*?ingredients\s*:?[\t ]*$/gim, '### Ingredients');
    out = out.replace(/^\s*#{1,3}\s*.*?instructions\s*:?[\t ]*$/gim, '### Instructions');
    // Optional sections
    out = out.replace(/^\s*#{1,3}\s*.*?equipment\s*:?[\t ]*$/gim, '### Equipment');
    out = out.replace(/^\s*#{1,3}\s*.*?nutrition(?:\s*facts)?\s*:?[\t ]*$/gim, '### Nutrition');
    // Also convert standalone headings (no # at all)
    out = out.replace(/^\s*ingredients\s*:?[\t ]*$/gim, '### Ingredients');
    out = out.replace(/^\s*instructions\s*:?[\t ]*$/gim, '### Instructions');
    out = out.replace(/^\s*equipment\s*:?[\t ]*$/gim, '### Equipment');
    out = out.replace(/^\s*nutrition(?:\s*\(per\s+serving\))?\s*:?[\t ]*$/gim, '### Nutrition');
    return out;
  }

  const filledHtml = useMemo(() => {
    if (!selected) return '';
    const source = normalizeForFlex(raw);
    const d = parseRecipeData(source);
    const filled = fillPlaceholders(selected.html, d, img, logoImg);
    return filled;
  }, [selected, raw, img, logoImg]);

  // Preview of edited template HTML
  const editedPreviewHtml = useMemo(() => {
    if (!editingTemplateHtml) return '';
    const source = normalizeForFlex(raw);
    const d = parseRecipeData(source);
    const filled = fillPlaceholders(editingTemplateHtml, d, img, logoImg);
    return filled;
  }, [editingTemplateHtml, raw, img, logoImg]);

  // Validate placeholders present in the selected template
  const missingPlaceholders = useMemo(() => {
    if (!selected) return [] as string[];
    
    // Skip validation for nutritional card templates
    const isNutritionCard = selected.name.toLowerCase().includes('nutrition') || 
                           selected.name.toLowerCase().includes('nutritional') ||
                           selected.id === 2; // Default nutritional card template ID
    
    if (isNutritionCard) {
      return [] as string[]; // Don't show missing placeholder warnings for nutritional cards
    }
    
    const required = ['TITLE', 'DESCRIPTION', 'INGREDIENTS', 'INSTRUCTIONS'];
    const misses: string[] = [];
    for (const key of required) {
      // Check for both {{KEY}} and KEY formats
      const reBraces = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'i');
      const reStandalone = new RegExp(`\\b${key}\\b`, 'i');
      if (!reBraces.test(selected.html) && !reStandalone.test(selected.html)) {
        misses.push(key);
      }
    }
    return misses;
  }, [selected]);

  function onFile(f: File) {
    if (!f.type.startsWith('image/')) {
      setNotification({ message: 'Please use an image file.', type: 'error' });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setNotification({ message: 'Image must be less than 10MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result));
    reader.readAsDataURL(f);
  }

  function onFileLogo(f: File) {
    if (!f.type.startsWith('image/')) {
      setNotification({ message: 'Please use an image file.', type: 'error' });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setNotification({ message: 'Image must be less than 10MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setLogoImg(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function copyHtml() {
    try {
      await navigator.clipboard.writeText(filledHtml);
      setNotification({ message: 'HTML copied to clipboard!', type: 'success' });
    } catch (err) {
      console.error('Failed to copy:', err);
      setNotification({ message: 'Failed to copy HTML. Please try again.', type: 'error' });
    }
  }

  function openEditModal() {
    if (!selected) return;
    setEditingTemplateHtml(selected.html);
    setEditingTemplateName(selected.name);
    setEditingPreviewImage(selected.preview_image_url);
    setEditingPreviewImageFile(null);
    setShowEditModal(true);
  }

  function onEditPreviewImage(f: File) {
    if (!f.type.startsWith('image/')) {
      setNotification({ message: 'Please use an image file.', type: 'error' });
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setNotification({ message: 'Image must be less than 10MB.', type: 'error' });
      return;
    }
    setEditingPreviewImageFile(f);
    const reader = new FileReader();
    reader.onload = () => setEditingPreviewImage(String(reader.result));
    reader.readAsDataURL(f);
  }

  async function saveTemplate() {
    if (!selected || !templateId) return;
    
    setIsSavingTemplate(true);
    try {
      let previewImageUrl = selected.preview_image_url;
      
      // Handle preview image removal (if it was removed)
      if (!editingPreviewImage && selected.preview_image_url && !editingPreviewImageFile) {
        // User removed the preview image - delete from storage
        const storageRef = extractSupabaseStoragePath(selected.preview_image_url);
        if (storageRef) {
          try {
            await supabase.storage.from(storageRef.bucket).remove([storageRef.path]);
          } catch (e) {
            console.warn('Failed to delete preview image:', e);
          }
        }
        previewImageUrl = null;
      }
      
      // Upload new preview image if provided
      if (editingPreviewImageFile) {
        const fileExt = editingPreviewImageFile.name.split('.').pop() || 'png';
        const fileName = `template-${templateId}-${Date.now()}.${fileExt}`;
        
        // Convert data URL to blob if needed, or use file directly
        let blob: Blob;
        if (editingPreviewImage?.startsWith('data:')) {
          const response = await fetch(editingPreviewImage);
          blob = await response.blob();
        } else {
          blob = editingPreviewImageFile;
        }
        
        // Delete old preview image if it exists
        if (selected.preview_image_url) {
          const storageRef = extractSupabaseStoragePath(selected.preview_image_url);
          if (storageRef) {
            try {
              await supabase.storage.from(storageRef.bucket).remove([storageRef.path]);
            } catch (e) {
              console.warn('Failed to delete old preview image:', e);
            }
          }
        }
        
        // Upload new image
        const { error: uploadError } = await supabase.storage
          .from('template-previews')
          .upload(fileName, blob, { upsert: true });

        if (uploadError) {
          console.error('Error uploading preview image:', uploadError);
          setNotification({ message: 'Error uploading preview image. Template saved without image update.', type: 'error' });
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('template-previews')
            .getPublicUrl(fileName);
          previewImageUrl = urlData.publicUrl;
        }
      }

      // Update template with name, HTML, and preview image
      const { error } = await supabase
        .from('templates')
        .update({
          name: editingTemplateName,
          html: editingTemplateHtml,
          preview_image_url: previewImageUrl,
          updated_at: new Date().toISOString()
        })
        .eq('id', templateId);

      if (error) {
        throw error;
      }

      // Reload templates to reflect changes
      await loadTemplates();
      
      // Update selected template name if it changed
      if (editingTemplateName !== selected.name) {
        setTemplateName(editingTemplateName);
      }
      
      setShowEditModal(false);
      setNotification({ message: 'Template updated successfully!', type: 'success' });
    } catch (err) {
      console.error('Error saving template:', err);
      setNotification({ message: 'Failed to save template. Please try again.', type: 'error' });
    } finally {
      setIsSavingTemplate(false);
    }
  }

  // Helper function to generate canvas from HTML
  async function generateCanvas(): Promise<HTMLCanvasElement> {
    // Check if template uses Google Fonts (needs iframe approach)
    const usesGoogleFonts = filledHtml.includes('fonts.googleapis.com') || filledHtml.includes('fonts.gstatic.com');
    let iframe: HTMLIFrameElement | null = null;
    
    if (usesGoogleFonts) {
      // Use iframe approach for templates with Google Fonts
      iframe = document.createElement('iframe');
      iframe.style.position = 'absolute';
      iframe.style.left = '-9999px';
      iframe.style.top = '0';
      iframe.style.width = '2000px';
      iframe.style.height = '3000px';
      iframe.style.border = 'none';
      iframe.style.overflow = 'visible';
      document.body.appendChild(iframe);

      // Wait for iframe to be ready
      await new Promise<void>((resolve) => {
        if (iframe) {
          iframe.onload = () => resolve();
          iframe.srcdoc = filledHtml;
        } else {
          resolve();
        }
      });

      // Wait for initial render
      await new Promise(resolve => setTimeout(resolve, 500));

      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
      if (!iframeDoc) {
        throw new Error('Could not access iframe document');
      }
      
      // Ensure iframe body/html are properly set up
      if (iframeDoc.body) {
        iframeDoc.body.style.margin = '0';
        iframeDoc.body.style.padding = '0';
        iframeDoc.body.style.overflow = 'visible';
      }
      if (iframeDoc.documentElement) {
        iframeDoc.documentElement.style.overflow = 'visible';
      }

      // Wait for stylesheets (Google Fonts) to load
      await new Promise<void>((resolve) => {
        const stylesheets = Array.from(iframeDoc.querySelectorAll('link[rel="stylesheet"]')) as HTMLLinkElement[];
        if (stylesheets.length === 0) {
          setTimeout(() => resolve(), 1000);
          return;
        }
        
        let stylesheetsLoaded = 0;
        const checkComplete = async () => {
          if (stylesheetsLoaded >= stylesheets.length) {
            // Wait for fonts to be fully loaded using Font Loading API
            try {
              if (iframeDoc.fonts && iframeDoc.fonts.ready) {
                await iframeDoc.fonts.ready;
              }
            } catch (e) {
              console.warn('Font loading API not available:', e);
            }
            setTimeout(() => resolve(), 1000);
          }
        };

        stylesheets.forEach((link) => {
          if (link.sheet) {
            stylesheetsLoaded++;
            checkComplete();
          } else {
            link.onload = () => {
              stylesheetsLoaded++;
              checkComplete();
            };
            link.onerror = () => {
              stylesheetsLoaded++;
              checkComplete();
            };
          }
        });

        // Fallback timeout
        setTimeout(() => {
          resolve();
        }, 6000);
      });

      // Wait for images to load
      await new Promise<void>((resolve) => {
        const images = Array.from(iframeDoc.querySelectorAll('img')) as HTMLImageElement[];
        if (images.length === 0) {
          resolve();
          return;
        }
        
        let imagesLoaded = 0;
        images.forEach((imgEl) => {
          if (imgEl.complete && (imgEl.naturalWidth > 0 || imgEl.src.startsWith('data:'))) {
            imagesLoaded++;
            if (imagesLoaded >= images.length) resolve();
          } else {
            imgEl.onload = () => {
              imagesLoaded++;
              if (imagesLoaded >= images.length) resolve();
            };
            imgEl.onerror = () => {
              imagesLoaded++;
              if (imagesLoaded >= images.length) resolve();
            };
          }
        });
        
        // Fallback timeout
        setTimeout(() => resolve(), 5000);
      });

      // Find the main container element (support multiple template structures)
      const cardElement = iframeDoc.querySelector('.page') || 
                         iframeDoc.querySelector('.recipe-card') || 
                         iframeDoc.querySelector('.nutrition-card') ||
                         iframeDoc.querySelector('.card') || 
                         iframeDoc.querySelector('.container') ||
                         iframeDoc.querySelector('.recipe-grid') ||
                         iframeDoc.body;

      if (!cardElement) {
        throw new Error('Could not find container element');
      }

      // Wait a bit more for fonts to fully render
      await new Promise(resolve => setTimeout(resolve, 500));

      // Generate canvas using html2canvas
      const canvas = await html2canvas(cardElement as HTMLElement, {
        backgroundColor: '#ffffff',
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false
      });

      // Clean up iframe
      if (iframe && iframe.parentNode) {
        document.body.removeChild(iframe);
      }

      return canvas;
    } else {
      // Use simple div approach for templates without Google Fonts
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = filledHtml;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.display = 'inline-block';
      document.body.appendChild(tempDiv);

      // Wait for content to render and all images to load
      await new Promise(resolve => setTimeout(resolve, 200));
      await new Promise(resolve => {
        const images = Array.from(tempDiv.querySelectorAll('img')) as HTMLImageElement[];
        if (images.length === 0) return resolve(undefined);
        let remaining = images.length;
        images.forEach(imgEl => {
          if (imgEl.complete) {
            remaining -= 1;
            if (remaining === 0) resolve(undefined);
          } else {
            const done = () => { remaining -= 1; if (remaining === 0) resolve(undefined); };
            imgEl.onload = done;
            imgEl.onerror = done;
          }
        });
      });
      
      // Get the actual card element (without body padding)
      // Many templates use `.recipe-card`; fall back to `.card` or the container
      const cardElement = (tempDiv.querySelector('.recipe-card') || tempDiv.querySelector('.nutrition-card') || tempDiv.querySelector('.card') || tempDiv) as HTMLElement;
      
      // Optionally constrain export width to a Canva-like size (keeps aspect ratio)
      const exportWidth = 1080; // change if you want 1200/1920/etc.
      const prevWidth = (cardElement as HTMLElement).style.width;
      if (exportWidth) {
        (cardElement as HTMLElement).style.width = `${exportWidth}px`;
      }

      // Wait a bit more for CSS pseudo-elements to render
      await new Promise(resolve => setTimeout(resolve, 300));

      // Generate canvas using html2canvas on the card element directly
      const canvas = await html2canvas(cardElement, {
        backgroundColor: '#ffffff',
        scale: 2, // increase scale for sharper output at fixed width
        useCORS: true,
        allowTaint: true,
        onclone: (clonedDoc, element) => {
          // Ensure all elements are visible
          const allElements = clonedDoc.querySelectorAll('*');
          allElements.forEach((el) => {
            const htmlEl = el as HTMLElement;
            htmlEl.style.visibility = 'visible';
            htmlEl.style.display = '';
            htmlEl.style.opacity = '1';
          });
          
          // Force pseudo-elements to render by accessing their computed styles
          const elementsWithPseudo = clonedDoc.querySelectorAll('.ingredients-list li, .instructions-list li, .meta span');
          elementsWithPseudo.forEach((el) => {
            const htmlEl = el as HTMLElement;
            // Access computed styles to trigger pseudo-element rendering
            const beforeStyle = clonedDoc.defaultView?.getComputedStyle(htmlEl, '::before');
            const afterStyle = clonedDoc.defaultView?.getComputedStyle(htmlEl, '::after');
            // Force reflow
            void htmlEl.offsetHeight;
          });
          
          // Ensure headings are visible and properly styled
          const headings = clonedDoc.querySelectorAll('h1, h2, h3, h4, h5, h6');
          headings.forEach((heading) => {
            const htmlHeading = heading as HTMLElement;
            htmlHeading.style.visibility = 'visible';
            htmlHeading.style.display = '';
            htmlHeading.style.opacity = '1';
            void htmlHeading.offsetHeight;
          });
          
          // Ensure emoji icons in meta spans are visible
          const metaSpans = clonedDoc.querySelectorAll('.meta span');
          metaSpans.forEach((span) => {
            const htmlSpan = span as HTMLElement;
            htmlSpan.style.visibility = 'visible';
            htmlSpan.style.display = '';
            htmlSpan.style.opacity = '1';
            // Force font rendering for emojis
            htmlSpan.style.fontFamily = 'Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol"';
            void htmlSpan.offsetHeight;
          });
        }
      });

      // Restore original width after capture
      (cardElement as HTMLElement).style.width = prevWidth;

      // Clean up
      document.body.removeChild(tempDiv);

      return canvas;
    }
  }

  async function generatePng() {
    if (!filledHtml) return;
    
    setIsGeneratingImage(true);
    
    try {
      const canvas = await generateCanvas();
      // Convert to JPEG blob
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.85);
      });
      
      const url = URL.createObjectURL(blob);
      setPngUrl(url);
      
      // Auto-download
      const link = document.createElement('a');
      link.href = url;
      link.download = `recipe-card-${Date.now()}.jpg`;
      link.click();
      
      setNotification({ message: 'Recipe card image generated and downloaded!', type: 'success' });
    } catch (err) {
      console.error('Failed to generate image:', err);
      setNotification({ message: `Failed to generate image: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`, type: 'error' });
    } finally {
      setIsGeneratingImage(false);
    }
  }

  async function generatePdf() {
    if (!filledHtml) return;
    
    setIsGeneratingPdf(true);
    
    try {
      const canvas = await generateCanvas();
      
      // Convert canvas to image data
      const imgData = canvas.toDataURL('image/png', 1.0);
      
      // Calculate PDF dimensions (convert pixels to mm)
      // jsPDF uses mm as units, and 1mm ≈ 3.779527559 pixels at 96 DPI
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const pdfWidth = imgWidth * 0.264583; // Convert px to mm
      const pdfHeight = imgHeight * 0.264583;
      
      // Create PDF with dimensions matching the canvas
      const pdf = new jsPDF({
        orientation: pdfWidth > pdfHeight ? 'landscape' : 'portrait',
        unit: 'mm',
        format: [pdfWidth, pdfHeight]
      });
      
      // Add image to PDF (fill entire page)
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      
      // Download PDF
      pdf.save(`recipe-card-${Date.now()}.pdf`);
      
      setNotification({ message: 'Recipe card PDF generated and downloaded!', type: 'success' });
    } catch (err) {
      console.error('Failed to generate PDF:', err);
      setNotification({ message: `Failed to generate PDF: ${err instanceof Error ? err.message : 'Unknown error'}. Please try again.`, type: 'error' });
    } finally {
      setIsGeneratingPdf(false);
    }
  }

  return (
    <div className="generator-shell">
      <div className="page-title">Generator</div>
      {/* Template gallery (uses Figma-like preview images; mapped by template id) */}
      <div className="gallery">
        {templates.map(t => (
          <div key={t.id} className={`gallery-card ${(templateId === t.id || templateName === t.name) ? 'selected' : ''}`} style={{position:'relative'}}>
            <button 
              style={{all:'unset',cursor:'pointer',display:'block',width:'100%'}} 
              onClick={(e)=>{
                e.preventDefault();
                e.stopPropagation();
                // Set templateName first, then templateId (matching dropdown behavior)
                setTemplateName(t.name);
                const foundTemplate = templates.find(tm => tm.name === t.name);
                if (foundTemplate) {
                  setTemplateId(foundTemplate.id);
                } else {
                  setTemplateId(t.id);
                }
              }}
            >
              <img src={getPreviewUrl(t)} alt={t.name} />
              <div className="gallery-name">{t.name}</div>
            </button>
          </div>
        ))}
      </div>
      <div className="shell-card">
        <div className="section-title">Content Creation Tools</div>
        {selected && missingPlaceholders.length > 0 && (
          <div style={{background:'#fff3cd',border:'1px solid #ffecb5',color:'#664d03',padding:10,borderRadius:8,marginBottom:10,fontSize:13}}>
            Missing placeholders in this template: {missingPlaceholders.map(ph => `{{${ph}}}`).join(', ')}
          </div>
        )}
        <div className="form-group">
          <label style={{fontWeight:700}}>Select Template</label>
          <div style={{display:'flex', gap:8, alignItems:'flex-end'}}>
            <select className="select" style={{marginTop:8, flex:1}} value={templateName} onChange={e=>{setTemplateName(e.target.value); const t = templates.find(tm => tm.name === e.target.value); if(t) setTemplateId(t.id);}}>
              <option value="">Choose a beautiful template…</option>
              {templates.map(t=> <option key={t.id} value={t.name}>{t.name}</option>)}
            </select>
            {selected && (
              <button className="btn btn-secondary" onClick={openEditModal} style={{marginTop:8, whiteSpace:'nowrap'}}>
                Edit Template
              </button>
            )}
          </div>
        </div>
        <div className="form-group">
          <label style={{fontWeight:700}}>Recipe Content <span style={{fontWeight:400,color:'#777',fontSize:12}}>(paste your content here)</span></label>
          <textarea className="textarea" style={{marginTop:8}} value={raw} onChange={e=>setRaw(e.target.value)} />
        </div>
        <div className="form-group">
            <label style={{fontWeight:700}}>Recipe Image (Optional, max 10MB)</label>
          <div className="dz" style={{marginTop:8}} onClick={()=>document.getElementById('rg-file')?.click()}
               onDragOver={e=>{e.preventDefault();}}
               onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) onFile(f);}}>
            Drag & drop an image or click to browse
            <input id="rg-file" type="file" accept="image/*" style={{display:'none'}}
                   onChange={e=>{const f=(e.target as HTMLInputElement).files?.[0]; if (f) onFile(f);}} />
            {img && <div style={{marginTop:10}}><img src={img} style={{maxWidth:220,borderRadius:10}} /></div>}
          </div>
        </div>
        <div className="form-group">
            <label style={{fontWeight:700}}>Logo Image (Optional, max 10MB)</label>
          <div className="dz" style={{marginTop:8}} onClick={()=>document.getElementById('rg-logo-file')?.click()}
               onDragOver={e=>{e.preventDefault();}}
               onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) onFileLogo(f);}}>
            Drag & drop a logo or click to browse
            <input id="rg-logo-file" type="file" accept="image/*" style={{display:'none'}}
                   onChange={e=>{const f=(e.target as HTMLInputElement).files?.[0]; if (f) onFileLogo(f);}} />
            {logoImg && <div style={{marginTop:10}}><img src={logoImg} style={{maxWidth:160,borderRadius:10,background:'#fff',padding:6}} /></div>}
          </div>
        </div>
        <div className="actions">
          <button className="btn btn-secondary" onClick={()=>setShowPreview(true)} disabled={!selected || !raw.trim()}>Preview</button>
          <button className="btn btn-warn" onClick={async ()=>{
            setGeneratedHtml(filledHtml);
            // Save generated HTML to Supabase
            if (selected && templateId) {
              try {
                const { error } = await supabase
                  .from('templates')
                  .update({
                    last_generated_html: filledHtml,
                    last_generated_at: new Date().toISOString()
                  })
                  .eq('id', templateId);
                
                if (error) {
                  console.error('Error saving generated HTML:', error);
                }
              } catch (err) {
                console.error('Error saving generated HTML:', err);
              }
            }
          }} disabled={!selected || !raw.trim()}>Generate</button>
        </div>
        {generatedHtml && (
          <div className="result-bar">
            <button className="btn" onClick={copyHtml}>Copy HTML</button>
            <button className="btn btn-secondary" onClick={generatePng} disabled={isGeneratingImage || isGeneratingPdf}>
              {isGeneratingImage ? 'Generating...' : 'Download Image'}
            </button>
            <button className="btn btn-secondary" onClick={generatePdf} disabled={isGeneratingImage || isGeneratingPdf}>
              {isGeneratingPdf ? 'Generating...' : 'Download PDF'}
            </button>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.5)',
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          zIndex:1000,
          padding:'20px',
          backdropFilter:'blur(6px)'
        }} onClick={()=>setShowPreview(false)}>
          <div style={{
            position:'relative',
            background:'rgba(255, 192, 203, 0.2)',
            border:'1px solid rgba(255, 182, 193, 0.6)',
            backdropFilter:'blur(10px) saturate(1.2)',
            borderRadius:'20px',
            maxWidth:'90vw',
            maxHeight:'90vh',
            overflow:'auto',
            boxShadow:'0 20px 60px rgba(204, 43, 94, 0.25), 0 8px 20px rgba(0,0,0,0.15)'
          }} onClick={(e)=>e.stopPropagation()}>
            {/* Close Button */}
            <button 
              onClick={()=>setShowPreview(false)}
              style={{
                position:'absolute',
                top:'15px',
                right:'15px',
                background:'#fff',
                border:'none',
                width:'40px',
                height:'40px',
                borderRadius:'50%',
                fontSize:'24px',
                cursor:'pointer',
                display:'flex',
                alignItems:'center',
                justifyContent:'center',
                boxShadow:'0 4px 12px rgba(0,0,0,0.2)',
                zIndex:10,
                transition:'all 0.2s',
                color:'#666'
              }}
              onMouseOver={(e)=>{e.currentTarget.style.transform='scale(1.1)'; e.currentTarget.style.background='#f0f0f0';}}
              onMouseOut={(e)=>{e.currentTarget.style.transform='scale(1)'; e.currentTarget.style.background='#fff';}}
            >
              ×
            </button>

            {/* Preview Content */}
            <div style={{
              padding:'40px',
              display:'flex',
              justifyContent:'center',
              alignItems:'flex-start'
            }}>
              <div style={{
                transform:'scale(0.75)',
                transformOrigin:'top center',
                width:'1300px',
                minWidth:'1300px'
              }}>
                <iframe 
                  title="preview" 
                  style={{
                    width:'1300px',
                    minWidth:'1300px',
                    height:'900px',
                    border:'2px solid rgba(255, 182, 193, 0.5)',
                    borderRadius:'12px',
                    background:'transparent'
                  }} 
                  srcDoc={filledHtml} 
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Template Modal */}
      {showEditModal && selected && (
        <div style={{
          position:'fixed',
          top:0,
          left:0,
          right:0,
          bottom:0,
          background:'rgba(0,0,0,0.7)',
          display:'flex',
          justifyContent:'center',
          alignItems:'center',
          zIndex:2000,
          padding:'20px',
          backdropFilter:'blur(6px)'
        }} onClick={()=>setShowEditModal(false)}>
          <div style={{
            position:'relative',
            background:'#fff',
            borderRadius:'12px',
            maxWidth:'95vw',
            height:'90vh',
            width:'1400px',
            display:'flex',
            flexDirection:'column',
            boxShadow:'0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e)=>e.stopPropagation()}>
            {/* Header */}
            <div style={{
              padding:'20px 24px',
              borderBottom:'1px solid #e0e0e0',
              display:'flex',
              justifyContent:'space-between',
              alignItems:'center'
            }}>
              <h2 style={{margin:0, fontSize:20, fontWeight:600}}>Edit Template</h2>
              <button 
                onClick={()=>setShowEditModal(false)}
                style={{
                  background:'transparent',
                  border:'none',
                  fontSize:24,
                  cursor:'pointer',
                  color:'#666',
                  width:32,
                  height:32,
                  display:'flex',
                  alignItems:'center',
                  justifyContent:'center',
                  borderRadius:4
                }}
                onMouseOver={(e)=>{e.currentTarget.style.background='#f0f0f0';}}
                onMouseOut={(e)=>{e.currentTarget.style.background='transparent';}}
              >
                ×
              </button>
            </div>

            {/* Template Name and Preview Image Section */}
            <div style={{
              padding:'16px 24px',
              borderBottom:'1px solid #e0e0e0',
              background:'#fafafa',
              display:'flex',
              gap:20,
              alignItems:'flex-start'
            }}>
              <div style={{flex:1}}>
                <label style={{display:'block', fontWeight:600, marginBottom:8, fontSize:14}}>
                  Change Temp Name
                </label>
                <input
                  type="text"
                  value={editingTemplateName}
                  onChange={(e) => setEditingTemplateName(e.target.value)}
                  style={{
                    width:'100%',
                    padding:'10px 12px',
                    border:'1px solid #ddd',
                    borderRadius:6,
                    fontSize:14,
                    fontFamily:'inherit'
                  }}
                  placeholder="Enter template name"
                />
              </div>
              <div style={{flex:1}}>
                <label style={{display:'block', fontWeight:600, marginBottom:8, fontSize:14}}>
                  Preview Image (Cover Pic)
                </label>
                <div style={{display:'flex', gap:12, alignItems:'center'}}>
                  {editingPreviewImage && (
                    <img 
                      src={editingPreviewImage} 
                      alt="Preview" 
                      style={{
                        width:80,
                        height:80,
                        objectFit:'cover',
                        borderRadius:6,
                        border:'1px solid #ddd'
                      }}
                    />
                  )}
                  <label style={{
                    padding:'10px 16px',
                    background:'#007bff',
                    color:'white',
                    borderRadius:6,
                    cursor:'pointer',
                    fontSize:14,
                    fontWeight:500,
                    display:'inline-block'
                  }}>
                    {editingPreviewImage ? 'Change Image' : 'Upload Image'}
                    <input
                      type="file"
                      accept="image/*"
                      style={{display:'none'}}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) onEditPreviewImage(file);
                      }}
                    />
                  </label>
                  {editingPreviewImage && (
                    <button
                      onClick={() => {
                        setEditingPreviewImage(null);
                        setEditingPreviewImageFile(null);
                      }}
                      style={{
                        padding:'10px 16px',
                        background:'#dc3545',
                        color:'white',
                        border:'none',
                        borderRadius:6,
                        cursor:'pointer',
                        fontSize:14,
                        fontWeight:500
                      }}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content - Split View */}
            <div style={{
              display:'flex',
              flex:1,
              overflow:'hidden',
              minHeight:0
            }}>
              {/* Left: Code Editor */}
              <div style={{
                flex:'0 0 50%',
                borderRight:'1px solid #e0e0e0',
                display:'flex',
                flexDirection:'column',
                overflow:'hidden'
              }}>
                <div style={{
                  padding:'12px 16px',
                  background:'#f5f5f5',
                  borderBottom:'1px solid #e0e0e0',
                  fontSize:12,
                  fontWeight:600,
                  color:'#666'
                }}>
                  HTML Code
                </div>
                <div style={{flex:1, minHeight:0, overflow:'hidden'}}>
                  <Editor
                    height="100%"
                    defaultLanguage="html"
                    value={editingTemplateHtml}
                    onChange={(value) => setEditingTemplateHtml(value || '')}
                    theme="vs-light"
                    options={{
                      minimap: { enabled: true },
                      fontSize: 14,
                      wordWrap: 'on',
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      formatOnPaste: true,
                      formatOnType: true,
                      tabSize: 2,
                      lineNumbers: 'on',
                      folding: true
                    }}
                  />
                </div>
              </div>

              {/* Right: Live Preview */}
              <div style={{
                flex:'0 0 50%',
                display:'flex',
                flexDirection:'column',
                overflow:'hidden',
                background:'#f9f9f9'
              }}>
                <div style={{
                  padding:'12px 16px',
                  background:'#f5f5f5',
                  borderBottom:'1px solid #e0e0e0',
                  fontSize:12,
                  fontWeight:600,
                  color:'#666'
                }}>
                  Live Preview
                </div>
                <div style={{
                  flex:1,
                  overflow:'auto',
                  padding:20,
                  display:'flex',
                  justifyContent:'center',
                  alignItems:'flex-start'
                }}>
                  <iframe 
                    title="template-edit-preview" 
                    style={{
                      width:'100%',
                      height:'100%',
                      border:'1px solid #e0e0e0',
                      borderRadius:8,
                      background:'#fff'
                    }} 
                    srcDoc={editedPreviewHtml || '<div style="padding:20px;color:#999;">Edit HTML to see preview...</div>'} 
                  />
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div style={{
              padding:'16px 24px',
              borderTop:'1px solid #e0e0e0',
              display:'flex',
              justifyContent:'flex-end',
              gap:12
            }}>
              <button 
                className="btn btn-secondary"
                onClick={()=>setShowEditModal(false)}
                disabled={isSavingTemplate}
              >
                Cancel
              </button>
              <button 
                className="btn"
                onClick={()=>setShowConfirmSave(true)}
                disabled={isSavingTemplate}
              >
                {isSavingTemplate ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Save Modal */}
      {showConfirmSave && selected && (
        <div style={{
          position:'fixed', top:0, left:0, right:0, bottom:0,
          background:'rgba(0,0,0,0.6)', display:'flex', justifyContent:'center', alignItems:'center',
          zIndex:3000, padding:'20px', backdropFilter:'blur(4px)'
        }} onClick={()=>!isSavingTemplate && setShowConfirmSave(false)}>
          <div style={{
            background:'#fff', borderRadius:12, width:'520px', maxWidth:'95vw',
            boxShadow:'0 16px 48px rgba(0,0,0,.25)', overflow:'hidden'
          }} onClick={(e)=>e.stopPropagation()}>
            <div style={{padding:'18px 20px', borderBottom:'1px solid #eee', fontWeight:700}}>Confirm Save</div>
            <div style={{padding:'18px 20px', color:'#333'}}>
              You are about to overwrite the template "{selected.name}" with your edits. This action cannot be undone.
            </div>
            <div style={{display:'flex', justifyContent:'flex-end', gap:10, padding:'14px 20px', borderTop:'1px solid #eee'}}>
              <button className="btn btn-secondary" onClick={()=>setShowConfirmSave(false)} disabled={isSavingTemplate}>Cancel</button>
              <button className="btn" onClick={async ()=>{ setShowConfirmSave(false); await saveTemplate(); }} disabled={isSavingTemplate}>{isSavingTemplate ? 'Saving...' : 'Confirm & Save'}</button>
            </div>
          </div>
        </div>
      )}

      {notification && (
        <Notification 
          message={notification.message} 
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}
    </div>
  );
}


