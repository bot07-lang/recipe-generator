import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
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
];

function getFieldBlock(text: string, label: string): string {
  const re = new RegExp(`${label}:\\s*([\\s\\S]*?)(?=(Recipe |Difficulty|No\\.|Preparation|Cooking|Rest|Total|Cooking Temp|Calories|Best Season|###|$))`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function getSection(text: string, keyword: string): string {
  const re = new RegExp(`###[\\s\\S]*?${keyword}[\\s\\S]*?\\n?([\\s\\S]*?)(?=###|$)`, "i");
  const m = text.match(re);
  return m ? m[1].trim() : "";
}

function cleanIngredients(text = ""): string[] {
  let t = text.replace(/^\s*•\s*/, "");
  t = t.replace(/(?:Ingredient\s*Title\s*:)?\s*Ingredients\s*:\s*/i, "").trim();
  t = t.replace(/\s+/g, " ");

  // add separators before quantity patterns like "1 ", "½ ", etc.
  t = t.replace(/(?<!,)\s(?=(?:\d+(?:-\d+)?|[¼½¾])(?:\s|\())/g, " |SEP| ");

  const parts = t
    .split(/,\s*| \|SEP\| /g)
    .map((s) => s.trim())
    .filter(Boolean);

  return parts;
}

function cleanDirections(text = ""): string[] {
  let t = text.replace(/^Instructions\s*:\s*/i, "").trim();

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

function parseRecipeData(t: string) {
  if (typeof t !== "string" || !t.trim()) return {};

  const title       = getFieldBlock(t, "Recipe Title");
  const description = getFieldBlock(t, "Recipe Description");
  const difficulty  = getFieldBlock(t, "Difficulty Level");
  const servings    = getFieldBlock(t, "No\\. of Servings");
  const prep        = getFieldBlock(t, "Preparation Time \\(Minutes\\)");
  const cook        = getFieldBlock(t, "Cooking Time \\(Minutes\\)");
  const rest        = getFieldBlock(t, "Rest Time \\(Minutes\\)");
  const total       = getFieldBlock(t, "Total Duration \\(Minutes\\)");
  const temp        = getFieldBlock(t, "Cooking Temp \\([^)]*\\)");
  let calories      = getFieldBlock(t, "Calories");
  const season      = getFieldBlock(t, "Best Season");

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

  return {
    title: title || "Untitled Recipe",
    description,
    difficulty,
    servings,
    prep_time_min: prep,
    cook_time_min: cook,
    rest_time_min: rest,
    total_time_min: total,
    temperature: temp,
    calories,
    season,
    ingredients, // Array of clean ingredients
    instructions, // Array of clean instructions
    equipment,
    nutrition
  };
}

const ingredientsHtml = (arr?: string[]) => arr?.length ? `<ul class="ingredients-list">${arr.map(i => `<li>${i}</li>`).join('')}</ul>` : '';
const instructionsHtml = (arr?: string[]) => arr?.length ? `<ul class="instructions-list">${arr.map(i => `<li>${i}</li>`).join('')}</ul>` : '';

// Replace any placeholders found in the html with data keys (case-insensitive)
function fillPlaceholders(templateHtml: string, data: Record<string, any>, imageSrc: string | null): string {
  let html = templateHtml;
  const map: Record<string, string> = {
    TITLE: data.title || '',
    DESCRIPTION: data.description || '',
    COOK_TIME: data.cook_time_min || '',
    TIME: data.cook_time_min || '', // Alternative key
    SERVINGS: data.servings || '',
    DIFFICULTY: data.difficulty || '',
    CALORIES: data.calories || '',
    RATING: data.rating || '5', // Default rating
    INGREDIENTS: ingredientsHtml(data.ingredients),
    INSTRUCTIONS: instructionsHtml(data.instructions),
    DIRECTIONS: instructionsHtml(data.instructions), // Alternative key
    IMAGE: imageSrc || '',
    IMAGE_URL: imageSrc || '',
    NOTES: data.notes || data.description || ''
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
  
  // Replace standalone KEY placeholders (without braces)
  html = html.replace(/\b([A-Z_]+)\b/g, (m, keyRaw) => {
    const key = String(keyRaw).toUpperCase();
    return key in map ? map[key] : m;
  });
  
  return html;
}

export default function Generator() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templateId, setTemplateId] = useState<number | null>(null);
  const [templateName, setTemplateName] = useState('');
  const [raw, setRaw] = useState(`Recipe Title: Delicious Banana Cake
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
3. Combine with dry ingredients and bake 40-45 minutes.`);
  const [img, setImg] = useState<string | null>(null);
  const [generatedHtml, setGeneratedHtml] = useState('');
  const [pngUrl, setPngUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
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

  useEffect(() => {
    loadTemplates();
  }, []);

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
    // Convert # or ### to our expected ### form
    out = out.replace(/^\s*#{1,3}\s*ingredients\s*:?[\t ]*$/gim, '### Ingredients');
    out = out.replace(/^\s*#{1,3}\s*instructions\s*:?[\t ]*$/gim, '### Instructions');
    // Optional sections
    out = out.replace(/^\s*#{1,3}\s*equipment\s*:?[\t ]*$/gim, '### Equipment');
    out = out.replace(/^\s*#{1,3}\s*nutrition(?:\s*facts)?\s*:?[\t ]*$/gim, '### Nutrition');
    // Also convert standalone headings (no # at all)
    out = out.replace(/^\s*ingredients\s*:?[\t ]*$/gim, '### Ingredients');
    out = out.replace(/^\s*instructions\s*:?[\t ]*$/gim, '### Instructions');
    return out;
  }

  const filledHtml = useMemo(() => {
    if (!selected) return '';
    const source = normalizeForFlex(raw);
    const d = parseRecipeData(source);
    const filled = fillPlaceholders(selected.html, d, img);
    return filled;
  }, [selected, raw, img]);

  // Validate placeholders present in the selected template
  const missingPlaceholders = useMemo(() => {
    if (!selected) return [] as string[];
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
    if (f.size > 5 * 1024 * 1024) {
      setNotification({ message: 'Image must be less than 5MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImg(String(reader.result));
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

  async function generatePng() {
    if (!filledHtml) return;
    
    setIsGenerating(true);
    try {
      // Create a temporary container for the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = filledHtml;
      tempDiv.style.position = 'absolute';
      tempDiv.style.left = '-9999px';
      tempDiv.style.top = '-9999px';
      tempDiv.style.width = '1000px'; // Match template's max-width (980px) + padding
      tempDiv.style.minWidth = '1000px';
      tempDiv.style.display = 'inline-block';
      document.body.appendChild(tempDiv);

      // Wait for content to render
      await new Promise(resolve => setTimeout(resolve, 100));
      
      // Get the actual card element (without body padding)
      const cardElement = tempDiv.querySelector('.card') as HTMLElement;
      
      // Generate PNG using html2canvas on the card element directly
      const canvas = await html2canvas(cardElement || tempDiv, {
        backgroundColor: '#ffffff',
        scale: 1.2, // Lower scale for smaller file size, still good quality
        useCORS: true,
        allowTaint: true
      });

      // Clean up
      document.body.removeChild(tempDiv);

      // Convert to JPEG blob with compression for smaller file size
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/jpeg', 0.85); // JPEG with 85% quality for smaller file size
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
      setNotification({ message: 'Failed to generate image. Please try again.', type: 'error' });
    } finally {
      setIsGenerating(false);
    }
  }

  return (
    <div className="generator-shell">
      <div className="page-title">Generator</div>
      {/* Template gallery (uses Figma-like preview images; mapped by template id) */}
      <div className="gallery">
        {templates.map(t => (
          <button key={t.id} className={`gallery-card ${(templateId === t.id || templateName === t.name) ? 'selected' : ''}`} onClick={()=>{setTemplateId(t.id); setTemplateName(t.name);}}>
            <img src={getPreviewUrl(t)} alt={t.name} />
            <div className="gallery-name">{t.name}</div>
          </button>
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
          <label>Select Template</label>
          <select className="select" value={templateName} onChange={e=>{setTemplateName(e.target.value); const t = templates.find(tm => tm.name === e.target.value); if(t) setTemplateId(t.id);}}>
            <option value="">Choose a beautiful template…</option>
            {templates.map(t=> <option key={t.id} value={t.name}>{t.name}</option>)}
          </select>
        </div>
        <div className="form-group">
          <label>Recipe Content</label>
          <textarea className="textarea" value={raw} onChange={e=>setRaw(e.target.value)} />
        </div>
        <div className="form-group" style={{fontSize:12,color:'#555'}}>
          This input accepts both formats: headers with or without "###" (Ingredients, Instructions, Equipment, Nutrition).
        </div>
        <div className="form-group">
          <label>Recipe Image (Optional, max 5MB)</label>
          <div className="dz" onClick={()=>document.getElementById('rg-file')?.click()}
               onDragOver={e=>{e.preventDefault();}}
               onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) onFile(f);}}>
            Drag & drop an image or click to browse
            <input id="rg-file" type="file" accept="image/*" style={{display:'none'}}
                   onChange={e=>{const f=(e.target as HTMLInputElement).files?.[0]; if (f) onFile(f);}} />
            {img && <div style={{marginTop:10}}><img src={img} style={{maxWidth:220,borderRadius:10}} /></div>}
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
            <button className="btn btn-secondary" onClick={generatePng} disabled={isGenerating}>
              {isGenerating ? 'Generating...' : 'Download Image'}
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


