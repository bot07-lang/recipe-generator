import { useState } from 'react';
import { supabase } from '../supabase';

export default function Developer() {
  const [name, setName] = useState('My Awesome Template');
  const [website, setWebsite] = useState('');
  const [html, setHtml] = useState('<div class="recipe-card">{{TITLE}}{{INGREDIENTS}}{{INSTRUCTIONS}}</div>');
  const [saved, setSaved] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

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
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('template-previews')
          .upload(fileName, blob);

        if (uploadError) {
          console.error('Error uploading image:', uploadError);
          alert('Error uploading preview image. Template saved without image.');
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
        alert('Error saving template. Please try again.');
        return;
      }

      setSaved(true); 
      setTimeout(()=>setSaved(false), 2000);
      
      // Clear form
      setName('My Awesome Template');
      setWebsite('');
      setHtml('<div class="recipe-card">{{TITLE}}{{INGREDIENTS}}{{INSTRUCTIONS}}</div>');
      setPreviewImage(null);
      
      alert('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Error saving template. Please try again.');
    }
  }

  function handleImageUpload(file: File) {
    if (!file.type.startsWith('image/')) return alert('Please use an image file.');
    if (file.size > 10 * 1024 * 1024) return alert('Image must be less than 10MB.');
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
        <div className="form-group"><label>Website (Optional)</label><input className="input" value={website} onChange={e=>setWebsite(e.target.value)} /></div>
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
        <div className="chips" style={{marginTop:8}}>
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
    </div>
  );
}


