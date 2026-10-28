import { useCallback, useEffect, useMemo, useState } from 'react';
import { ArrowLeft, ArrowUpRight, Check, ImagePlus, LoaderCircle, Mail, PackageCheck, PackagePlus, Pencil, Plus, RotateCcw, Save, Trash2, UploadCloud, X } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { apiRequest } from '../services/api.js';
import { formatCurrency } from '../utils/currency.js';

const blankImage = () => ({ url: '', publicId: '', alt: '' });
const blankVariant = () => ({ sku: '', size: 'M', color: 'Black', stock: 10 });
const blankProduct = () => ({ name: '', slug: '', category: '', description: '', details: '', price: '', compareAtPrice: '', badge: '', featured: false, active: true, mainImage: blankImage(), galleryImages: [blankImage(), blankImage(), blankImage(), blankImage()], variants: [blankVariant()] });

export default function AdminProductsPage() {
  const location = useLocation();
  const [tab, setTab] = useState(location.hash === '#categories' ? 'categories' : 'products');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(blankProduct);
  const [editingId, setEditingId] = useState('');
  const [categoryForm, setCategoryForm] = useState({ name: '', slug: '', description: '', imageUrl: '' });
  const [categoryEditingId, setCategoryEditingId] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [productResult, categoryResult] = await Promise.all([apiRequest('/admin/products'), apiRequest('/admin/categories')]);
      setProducts(productResult.products || []);
      setCategories(categoryResult.categories || []);
    } catch (loadError) {
      setError(loadError.message);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (location.hash === '#categories') setTab('categories'); }, [location.hash]);

  const activeCategories = useMemo(() => categories.filter((category) => category.active), [categories]);

  function resetForm() {
    setForm({ ...blankProduct(), category: activeCategories[0]?._id || '' });
    setEditingId('');
    setShowForm(false);
    setError('');
  }

  function startCreate() {
    setForm({ ...blankProduct(), category: activeCategories[0]?._id || '' });
    setEditingId('');
    setShowForm(true);
    setError('');
    setMessage('');
  }

  function startEdit(product) {
    setForm({
      name: product.name || '', slug: product.slug || '', category: product.category?._id || product.category || '',
      description: product.description || '', details: product.details || '', price: String(product.price ?? ''),
      compareAtPrice: product.compareAtPrice == null ? '' : String(product.compareAtPrice), badge: product.badge || '',
      featured: Boolean(product.featured), active: Boolean(product.active),
      mainImage: product.mainImage?.url ? { ...product.mainImage } : blankImage(),
      galleryImages: Array.from({ length: 4 }, (_, index) => product.galleryImages?.[index] ? { ...product.galleryImages[index] } : blankImage()),
      variants: product.variants?.length ? product.variants.map((variant) => ({ _id: variant._id, sku: variant.sku || '', size: variant.size || 'One size', color: variant.color || '', stock: Number(variant.stock) || 0 })) : [blankVariant()],
    });
    setEditingId(product._id);
    setShowForm(true);
    setTab('products');
    setError('');
    setMessage('');
  }

  function updateForm(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
    if (field === 'name' && !editingId) setForm((current) => ({ ...current, name: value, slug: current.slug || value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }));
  }

  function updateImage(slot, value, index) {
    if (slot === 'mainImage') setForm((current) => ({ ...current, mainImage: { ...current.mainImage, ...value } }));
    else setForm((current) => ({ ...current, galleryImages: current.galleryImages.map((image, imageIndex) => imageIndex === index ? { ...image, ...value } : image) }));
  }

  async function uploadImage(file, slot, index) {
    if (!file) return;
    setUploadingField(`${slot}-${index ?? 0}`);
    setError('');
    try {
      const signature = await apiRequest('/admin/media/signature', { method: 'POST', body: JSON.stringify({}) });
      const data = new FormData();
      data.append('file', file);
      data.append('api_key', signature.apiKey);
      data.append('timestamp', String(signature.timestamp));
      data.append('folder', signature.folder);
      data.append('signature', signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'Cloudinary could not upload this image.');
      updateImage(slot, { url: result.secure_url, publicId: result.public_id, alt: slot === 'mainImage' ? `${form.name || 'Product'} main view` : `${form.name || 'Product'} detail view` }, index);
      setMessage('Image uploaded securely to Cloudinary.');
    } catch (uploadError) {
      setError(uploadError.message);
    } finally { setUploadingField(''); }
  }

  function updateVariant(index, field, value) {
    setForm((current) => ({ ...current, variants: current.variants.map((variant, variantIndex) => variantIndex === index ? { ...variant, [field]: field === 'stock' ? Math.max(0, Number(value) || 0) : value } : variant) }));
  }

  async function saveProduct(event) {
    event.preventDefault();
    setError(''); setMessage(''); setSaving(true);
    if (!form.mainImage.url) { setError('Upload or provide a main product image.'); setSaving(false); return; }
    if (form.galleryImages.some((image) => !image.url)) { setError('Upload or provide all four gallery images. Each product needs exactly five images.'); setSaving(false); return; }
    if (!form.category) { setError('Create or select a category first.'); setSaving(false); return; }
    const payload = {
      ...form,
      price: Number(form.price),
      compareAtPrice: form.compareAtPrice === '' ? null : Number(form.compareAtPrice),
      mainImage: { ...form.mainImage, alt: form.mainImage.alt || `${form.name} main product image` },
      galleryImages: form.galleryImages.map((image, index) => ({ ...image, alt: image.alt || `${form.name} gallery image ${index + 1}` })),
      variants: form.variants.map((variant, index) => ({ ...variant, sku: variant.sku.trim() || `${form.slug || 'NOOR'}-${index + 1}`.toUpperCase() })),
    };
    try {
      const result = await apiRequest(editingId ? `/admin/products/${editingId}` : '/admin/products', { method: editingId ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      setMessage(editingId ? 'Product updated.' : 'Product created. It is now stored in MongoDB Atlas.');
      setShowForm(false); setEditingId('');
      await loadData();
      if (result.product) setMessage(`${result.product.name} saved. The storefront product page now receives its five images from the API.`);
    } catch (saveError) { setError(saveError.message); }
    finally { setSaving(false); }
  }

  async function archiveProduct(product) {
    if (!window.confirm(`Archive “${product.name}”? It will no longer appear in the storefront.`)) return;
    setError(''); setMessage('');
    try { await apiRequest(`/admin/products/${product._id}`, { method: 'DELETE' }); setMessage(`${product.name} archived.`); await loadData(); }
    catch (archiveError) { setError(archiveError.message); }
  }

  async function uploadCategoryImage(file) {
    if (!file) return;
    setUploadingField('category-image'); setError('');
    try {
      const signature = await apiRequest('/admin/media/signature', { method: 'POST', body: JSON.stringify({}) });
      const data = new FormData();
      data.append('file', file);
      data.append('api_key', signature.apiKey);
      data.append('timestamp', String(signature.timestamp));
      data.append('folder', signature.folder);
      data.append('signature', signature.signature);
      const response = await fetch(`https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`, { method: 'POST', body: data });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error?.message || 'Cloudinary could not upload this category image.');
      setCategoryForm((current) => ({ ...current, imageUrl: result.secure_url }));
      setMessage('Category image uploaded securely to Cloudinary.');
    } catch (uploadError) { setError(uploadError.message); }
    finally { setUploadingField(''); }
  }

  function editCategory(category) {
    setCategoryEditingId(category._id);
    setCategoryForm({ name: category.name || '', slug: category.slug || '', description: category.description || '', imageUrl: category.imageUrl || '' });
    setError(''); setMessage('');
    setTab('categories');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function resetCategoryForm() {
    setCategoryEditingId('');
    setCategoryForm({ name: '', slug: '', description: '', imageUrl: '' });
  }

  async function createCategory(event) {
    event.preventDefault(); setError(''); setMessage('');
    try {
      await apiRequest(categoryEditingId ? `/admin/categories/${categoryEditingId}` : '/admin/categories', { method: categoryEditingId ? 'PUT' : 'POST', body: JSON.stringify(categoryForm) });
      const action = categoryEditingId ? 'updated' : 'created';
      resetCategoryForm();
      setMessage(`Category ${action}.`); await loadData();
    } catch (categoryError) { setError(categoryError.message); }
  }

  async function archiveCategory(category) {
    if (!window.confirm(`Archive “${category.name}”?`)) return;
    try { await apiRequest(`/admin/categories/${category._id}`, { method: 'DELETE' }); setMessage(`${category.name} archived.`); await loadData(); }
    catch (categoryError) { setError(categoryError.message); }
  }

  async function restoreCategory(category) {
    try { await apiRequest(`/admin/categories/${category._id}/restore`, { method: 'PATCH' }); setMessage(`${category.name} restored.`); await loadData(); }
    catch (categoryError) { setError(categoryError.message); }
  }

  return <div className="admin-shell"><aside className="admin-sidebar"><Link to="/" className="wordmark">NOOR<span>®</span></Link><p className="admin-side-label">WORKSPACE</p><Link className="admin-nav-item" to="/admin/dashboard">Overview</Link><Link className="admin-nav-item active" to="/admin/products">Products & media</Link><Link className="admin-nav-item" to="/admin/orders"><PackageCheck size={17}/> Orders</Link><Link className="admin-nav-item" to="/admin/messages"><Mail size={17}/> Contact inbox</Link><Link className="admin-nav-item" to="/admin/products#categories" onClick={() => setTab('categories')}>Categories</Link><Link className="admin-nav-item" to="/">View storefront</Link><div className="admin-user"><span>SA</span><div><strong>Store admin</strong><small>Administrator</small></div></div></aside>
    <main className="admin-main admin-catalog-main"><header className="admin-topbar"><div><p className="eyebrow">STORE MANAGEMENT</p><h1>Catalogue & media</h1></div><div className="admin-topbar-actions"><Link to="/" className="view-store-link">View storefront <ArrowUpRight size={15}/></Link><Link to="/admin/dashboard" className="admin-back-link"><ArrowLeft size={13}/> Overview</Link></div></header>
      <div className="admin-catalog-intro"><div><p className="eyebrow">PRODUCT STORY, FIVE FRAMES</p><h2>Manage every <em>detail.</em></h2><p>Each product uses one main photo and exactly four gallery photos. Upload through signed Cloudinary requests or paste an existing image URL.</p></div><span className="admin-catalog-count"><strong>{products.length}</strong><small>CATALOGUE ITEMS</small></span></div>
      {(error || message) && <div className={error ? 'admin-inline-alert error' : 'admin-inline-alert success'}>{error || message}<button type="button" onClick={() => { setError(''); setMessage(''); }} aria-label="Dismiss notice"><X size={14}/></button></div>}
      <div className="admin-catalog-toolbar"><div className="admin-tabs"><button type="button" className={tab === 'products' ? 'active' : ''} onClick={() => { setTab('products'); setShowForm(false); }}>Products <span>{products.length}</span></button><button type="button" className={tab === 'categories' ? 'active' : ''} onClick={() => { setTab('categories'); setShowForm(false); }}>Categories <span>{categories.length}</span></button></div>{tab === 'products' && <button className="admin-primary-button" type="button" onClick={startCreate}><Plus size={15}/> Add product</button>}</div>

      {loading ? <div className="admin-catalog-loading"><LoaderCircle size={20}/> Loading catalogue…</div> : tab === 'products' ? <>
        {showForm && <form className="admin-product-form" onSubmit={saveProduct}>
          <div className="admin-form-header"><div><p className="eyebrow">{editingId ? 'EDIT PRODUCT' : 'NEW PRODUCT'}</p><h3>{editingId ? 'Refine the details.' : 'Add a new piece.'}</h3></div><button type="button" className="admin-icon-close" onClick={resetForm} aria-label="Close product form"><X size={17}/></button></div>
          <div className="admin-form-grid"><AdminField label="Product name" value={form.name} onChange={(value) => updateForm('name', value)} required/><AdminField label="URL slug" value={form.slug} onChange={(value) => updateForm('slug', value)} required/><label className="admin-field"><span>Category</span><select value={form.category} onChange={(event) => updateForm('category', event.target.value)} required><option value="">Select category</option>{activeCategories.map((category) => <option key={category._id} value={category._id}>{category.name}</option>)}</select></label><AdminField label="Price (₹)" type="number" value={form.price} onChange={(value) => updateForm('price', value)} required min="0"/><AdminField label="Compare-at price (₹), optional" type="number" value={form.compareAtPrice} onChange={(value) => updateForm('compareAtPrice', value)} min="0"/><AdminField label="Product badge, optional" value={form.badge} onChange={(value) => updateForm('badge', value)} placeholder="Bestseller / New arrival"/><AdminField label="Short description" value={form.description} onChange={(value) => updateForm('description', value)} wide required/><AdminField label="Fabric / product details" value={form.details} onChange={(value) => updateForm('details', value)} wide/><div className="admin-form-checks"><label><input type="checkbox" checked={form.featured} onChange={(event) => updateForm('featured', event.target.checked)}/> Feature on homepage</label><label><input type="checkbox" checked={form.active} onChange={(event) => updateForm('active', event.target.checked)}/> Active in storefront</label></div></div>
          <div className="admin-image-editor"><div className="admin-image-editor-heading"><div><p className="eyebrow">PRODUCT PHOTOGRAPHY</p><h4>One main image + four details</h4></div><span>{[form.mainImage, ...form.galleryImages].filter((image) => image.url).length}/5 images ready</span></div>
            <AdminImageField title="Main product image" image={form.mainImage} busy={uploadingField === 'mainImage-0'} onChange={(value) => updateImage('mainImage', value)} onUpload={(file) => uploadImage(file, 'mainImage', 0)}/>
            <div className="admin-gallery-editor">{form.galleryImages.map((image, index) => <AdminImageField key={index} title={`Gallery image ${index + 1}`} image={image} busy={uploadingField === `galleryImages-${index}`} onChange={(value) => updateImage('galleryImages', value, index)} onUpload={(file) => uploadImage(file, 'galleryImages', index)}/>)}</div>
          </div>
          <div className="admin-variants-editor"><div className="admin-image-editor-heading"><div><p className="eyebrow">INVENTORY</p><h4>Sizes, colours & stock</h4></div><button type="button" className="admin-add-variant" onClick={() => setForm((current) => ({ ...current, variants: [...current.variants, blankVariant()] }))}><Plus size={13}/> Add variant</button></div><div className="admin-variant-head"><span>Colour</span><span>Size</span><span>SKU</span><span>Stock</span><span/></div>{form.variants.map((variant, index) => <div className="admin-variant-row" key={variant._id || `variant-${index}`}><input aria-label={`Variant ${index + 1} colour`} value={variant.color} onChange={(event) => updateVariant(index, 'color', event.target.value)} placeholder="Colour" required/><input aria-label={`Variant ${index + 1} size`} value={variant.size} onChange={(event) => updateVariant(index, 'size', event.target.value)} placeholder="Size" required/><input aria-label={`Variant ${index + 1} SKU`} value={variant.sku} onChange={(event) => updateVariant(index, 'sku', event.target.value)} placeholder="SKU"/><input aria-label={`Variant ${index + 1} stock`} type="number" min="0" value={variant.stock} onChange={(event) => updateVariant(index, 'stock', event.target.value)} required/><button type="button" aria-label="Remove variant" disabled={form.variants.length <= 1} onClick={() => setForm((current) => ({ ...current, variants: current.variants.filter((_, variantIndex) => variantIndex !== index) }))}><Trash2 size={14}/></button></div>)}</div>
          <div className="admin-form-actions"><button type="button" className="admin-secondary-button" onClick={resetForm}>Cancel</button><button type="submit" className="admin-primary-button" disabled={saving}>{saving ? <LoaderCircle size={15}/> : <Save size={15}/>} {saving ? 'Saving…' : editingId ? 'Save changes' : 'Create product'}</button></div>
        </form>}
        <div className="admin-catalog-table-wrap"><table className="admin-catalog-table"><thead><tr><th>PRODUCT</th><th>CATEGORY</th><th>PRICE</th><th>STOCK</th><th>IMAGES</th><th>STATUS</th><th>ACTIONS</th></tr></thead><tbody>{products.map((product) => <tr key={product._id}><td><div className="admin-product-cell"><img src={product.mainImage?.url || product.images?.[0]?.url} alt=""/><div><strong>{product.name}</strong><small>/{product.slug}</small></div></div></td><td>{product.category?.name || '—'}</td><td>{formatCurrency(product.price)}</td><td><StockCell product={product}/></td><td><span className="admin-image-count"><ImagePlus size={13}/>{(product.mainImage?.url ? 1 : 0) + (product.galleryImages?.length || 0)}/5</span></td><td><span className={`admin-status-pill ${product.active ? 'live' : 'archived'}`}>{product.active ? 'Live' : 'Archived'}</span></td><td><div className="admin-row-actions"><button type="button" aria-label={`Edit ${product.name}`} onClick={() => startEdit(product)}><Pencil size={14}/></button>{product.active && <button type="button" aria-label={`Archive ${product.name}`} onClick={() => archiveProduct(product)}><Trash2 size={14}/></button>}</div></td></tr>)}</tbody></table>{products.length === 0 && <div className="admin-catalog-empty"><PackagePlus size={26}/><strong>No products yet.</strong><p>Add your first product to start filling the storefront.</p><button className="admin-primary-button" type="button" onClick={startCreate}><Plus size={14}/> Add product</button></div>}</div>
      </> : <section className="admin-category-manager" id="categories"><form onSubmit={createCategory} className="admin-category-create"><div><p className="eyebrow">GROW THE COLLECTION</p><h3>{categoryEditingId ? 'Edit this category.' : 'Add a category.'}</h3><p>Categories can be assigned to products and used as storefront filters.</p></div><AdminField label="Category name" value={categoryForm.name} onChange={(value) => setCategoryForm((current) => ({ ...current, name: value, slug: current.slug || value.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') }))} required/><AdminField label="URL slug" value={categoryForm.slug} onChange={(value) => setCategoryForm((current) => ({ ...current, slug: value }))}/><AdminField label="Short description" value={categoryForm.description} onChange={(value) => setCategoryForm((current) => ({ ...current, description: value }))}/><AdminField label="Image URL" value={categoryForm.imageUrl} onChange={(value) => setCategoryForm((current) => ({ ...current, imageUrl: value }))}/><label className="admin-upload-button category-upload-button"><input type="file" accept="image/*" onChange={(event) => { uploadCategoryImage(event.target.files?.[0]); event.target.value = ''; }}/>{uploadingField === 'category-image' ? <LoaderCircle size={13}/> : <UploadCloud size={13}/>} {uploadingField === 'category-image' ? 'Uploading category image…' : 'Upload category image to Cloudinary'}</label><div className="admin-form-actions">{categoryEditingId && <button type="button" className="admin-secondary-button" onClick={resetCategoryForm}>Cancel edit</button>}<button type="submit" className="admin-primary-button">{categoryEditingId ? <Save size={14}/> : <Plus size={14}/>} {categoryEditingId ? 'Save category' : 'Create category'}</button></div></form><div className="admin-category-list">{categories.map((category) => <article key={category._id} className="admin-category-card"><div className="admin-category-image">{category.imageUrl && <img src={category.imageUrl} alt=""/>}</div><div><strong>{category.name}</strong><small>/{category.slug}</small><p>{category.description || 'No category description added.'}</p><span className={`admin-status-pill ${category.active ? 'live' : 'archived'}`}>{category.active ? 'Active' : 'Archived'}</span></div><div className="admin-row-actions"><button type="button" aria-label={`Edit ${category.name}`} onClick={() => editCategory(category)}><Pencil size={14}/></button>{category.active ? <button type="button" aria-label={`Archive ${category.name}`} onClick={() => archiveCategory(category)}><Trash2 size={14}/></button> : <button type="button" aria-label={`Restore ${category.name}`} onClick={() => restoreCategory(category)}><RotateCcw size={14}/></button>}</div></article>)}</div></section>}
    </main></div>;
}

function AdminField({ label, value, onChange, type = 'text', required = false, wide = false, ...props }) {
  return <label className={`admin-field ${wide ? 'wide' : ''}`}><span>{label}</span>{wide && (label.toLowerCase().includes('description') || label.toLowerCase().includes('details')) ? <textarea value={value} onChange={(event) => onChange(event.target.value)} required={required} {...props}/> : <input type={type} value={value} onChange={(event) => onChange(event.target.value)} required={required} {...props}/>}</label>;
}

function AdminImageField({ title, image, busy, onChange, onUpload }) {
  return <div className="admin-image-field"><div className="admin-image-preview">{image.url ? <img src={image.url} alt={image.alt || title}/> : <span><ImagePlus size={19}/><small>IMAGE {title.toUpperCase().includes('MAIN') ? '01' : ''}</small></span>}</div><div className="admin-image-controls"><strong>{title}</strong><input type="url" value={image.url} onChange={(event) => onChange({ url: event.target.value, publicId: '', alt: image.alt })} placeholder="https://… Cloudinary image URL" aria-label={`${title} URL`}/><div className="admin-image-bottom"><label className="admin-upload-button"><input type="file" accept="image/*" onChange={(event) => { onUpload(event.target.files?.[0]); event.target.value = ''; }}/>{busy ? <LoaderCircle size={13}/> : <UploadCloud size={13}/>} {busy ? 'Uploading…' : 'Upload image'}</label><input type="text" value={image.alt || ''} onChange={(event) => onChange({ alt: event.target.value })} placeholder="Image alt text" aria-label={`${title} alt text`}/></div></div></div>;
}


function StockCell({ product }) {
  const stock = Math.max(0, Number(product.stockCount ?? product.variants?.reduce((sum, variant) => sum + (Number(variant.stock) || 0), 0)) || 0);
  const state = stock === 0 ? 'out' : stock <= 5 ? 'low' : 'healthy';
  const label = state === 'out' ? 'Out of stock' : state === 'low' ? 'Low stock' : 'In stock';
  return <div className="admin-stock-cell"><strong>{stock}</strong><span className={`admin-stock-state ${state}`}>{label}</span></div>;
}
