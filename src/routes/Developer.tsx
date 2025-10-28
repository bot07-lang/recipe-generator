import { useState } from 'react';
import { supabase } from '../supabase';
import Notification from '../components/Notification';

export default function Developer() {
  const [name, setName] = useState('My Awesome Template');
  const [html, setHtml] = useState('<div class="recipe-card">{{TITLE}}{{INGREDIENTS}}{{INSTRUCTIONS}}</div>');
  const [saved, setSaved] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  async function saveTemplate() {
    try {
      // Upload preview image to Supabase storage if provided
      let previewImageUrl = null;
      if (previewImage) {
        const fileExt = previewImage.split(';')[0].split('/')[1];
        const fileName = `template-${Date.now()}.${fileExt}`;
        
        // Convert base64 to blob
        const response = await fetch(previewImage);
        const blob = await response.blob();
        
        const { error: uploadError } = await supabase.storage
          .from('template-previews')
          .upload(fileName, blob);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          setNotification({ message: 'Error uploading preview image. Template saved without image.', type: 'error' });
        } else {
          // Get public URL
          const { data: urlData } = supabase.storage
            .from('template-previews')
            .getPublicUrl(fileName);
          previewImageUrl = urlData.publicUrl;
        }
      }

      // Save template to database
      const { data, error } = await supabase
        .from('templates')
        .insert([
          {
            name,
            html,
            preview_image_url: previewImageUrl,
            created_by: 'developer'
          }
        ])
        .select();

      if (error) {
        console.error('Error saving template:', error);
        setNotification({ message: 'Error saving template. Please try again.', type: 'error' });
        return;
      }

      setSaved(true); 
      setTimeout(()=>setSaved(false), 2000);
      
      // Clear form
      setName('My Awesome Template');
      setHtml('<div class="recipe-card">{{TITLE}}{{INGREDIENTS}}{{INSTRUCTIONS}}</div>');
      setPreviewImage(null);
      
      setNotification({ message: 'Template saved successfully!', type: 'success' });
    } catch (error) {
      console.error('Error saving template:', error);
      setNotification({ message: 'Error saving template. Please try again.', type: 'error' });
    }
  }

  function handleImageUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      setNotification({ message: 'Please use an image file.', type: 'error' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setNotification({ message: 'Image must be less than 10MB.', type: 'error' });
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setPreviewImage(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="generator-shell">
      <div className="page-title">Developer Template Manager</div>
      <div className="shell-card">
        <div className="section-title">Template Manager</div>
        <div className="form-group"><label>Template Name</label><input className="input" value={name} onChange={e=>setName(e.target.value)} /></div>
        <div className="form-group"><label>Preview Image (Optional)</label>
          <div className="dz" onClick={()=>document.getElementById('preview-file')?.click()}
               onDragOver={e=>{e.preventDefault();}}
               onDrop={e=>{e.preventDefault(); const f=e.dataTransfer.files?.[0]; if (f) handleImageUpload(f);}}>
            {previewImage ? (
              <div><img src={previewImage} style={{maxWidth:200,borderRadius:8}} /><br/><small>Click to change</small></div>
            ) : (
              <div>Drag & drop preview image or click to browse</div>
            )}
            <input id="preview-file" type="file" accept="image/*" style={{display:'none'}}
                   onChange={e=>{const f=(e.target as HTMLInputElement).files?.[0]; if (f) handleImageUpload(f);}} />
          </div>
        </div>
        <div className="form-group"><label>HTML Template Code</label><textarea className="textarea" value={html} onChange={e=>setHtml(e.target.value)} /></div>
        
        <div style={{
          background:'#e0f2fe',
          border:'1px solid #0ea5e9',
          borderRadius:'8px',
          padding:'12px',
          marginTop:'12px',
          fontSize:'13px',
          lineHeight:'1.5'
        }}>
          <strong style={{display:'block', marginBottom:'6px', color:'#0369a1'}}>📍 Placeholder Format Guide:</strong>
          <div style={{color:'#0c4a6e'}}>
            • Use <code style={{background:'#bae6fd', padding:'2px 6px', borderRadius:'4px'}}>{'{{KEY}}'}</code> format (recommended)<br/>
            • Also supports <code style={{background:'#bae6fd', padding:'2px 6px', borderRadius:'4px'}}>{'[KEY]'}</code> or plain <code style={{background:'#bae6fd', padding:'2px 6px', borderRadius:'4px'}}>KEY</code> format<br/>
            • Placeholders are case-insensitive<br/>
            • Click the chips below to copy placeholders to your HTML
          </div>
        </div>
        
        <div className="chips" style={{marginTop:12}}>
          <span className="chip">{'{{TITLE}}'}</span>
          <span className="chip">{'{{DESCRIPTION}}'}</span>
          <span className="chip">{'{{COOK_TIME}}'}</span>
          <span className="chip">{'{{SERVINGS}}'}</span>
          <span className="chip">{'{{DIFFICULTY}}'}</span>
          <span className="chip">{'{{CALORIES}}'}</span>
          <span className="chip">{'{{INGREDIENTS}}'}</span>
          <span className="chip">{'{{INSTRUCTIONS}}'}</span>
          <span className="chip">{'{{IMAGE}}'}</span>
        </div>
               <div className="actions" style={{marginTop:12}}>
                 <button className="btn" onClick={saveTemplate}>Save Template</button>
                 {saved && <span style={{color:'#0f766e',fontWeight:700}}>Saved!</span>}
               </div>
      </div>
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


