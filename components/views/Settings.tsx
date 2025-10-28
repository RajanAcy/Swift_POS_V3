import React, { useState, useEffect } from 'react';
import { useData } from '../../contexts/DataContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { CompanyInfo, SystemSettings } from '../../types';
import Modal from '../shared/Modal';

const Settings: React.FC = () => {
    const { 
        companyInfo, systemSettings, categories, 
        saveCompanyInfo, saveSystemSettings, showToast, 
        resetAllData, importData, 
        addCategory, deleteCategory, updateCategory,
        selectDirectory, exportBackup,
        isInIframe, isFileSystemApiSupported,
    } = useData();
    const { t, language, setLanguage } = useLanguage();
    
    const [companyData, setCompanyData] = useState<CompanyInfo>(companyInfo);
    const [systemData, setSystemData] = useState<SystemSettings>(systemSettings);
    
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ oldName: string; newName: string } | null>(null);

    // State for Storage Preferences form
    const [storagePref, setStoragePref] = useState(systemSettings.storagePreference);
    const [storagePath, setStoragePath] = useState(systemSettings.storagePath);

    useEffect(() => {
        setStoragePref(systemSettings.storagePreference);
        setStoragePath(systemSettings.storagePath);
    }, [systemSettings]);

    const handleCompanyChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setCompanyData({ ...companyData, [e.target.name]: e.target.value });
    };

    const handleCompanyLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setCompanyData(prev => ({ ...prev, logo: reader.result as string }));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSystemChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        if (type === 'checkbox') {
             const { checked } = e.target as HTMLInputElement;
             setSystemData({ ...systemData, [name]: checked });
        } else {
             setSystemData({ ...systemData, [name]: value });
        }
    };
    
    const saveCompany = (e: React.FormEvent) => {
        e.preventDefault();
        saveCompanyInfo(companyData);
        showToast(t('Company information saved'), 'success');
    };
    
    const saveSystem = (e: React.FormEvent) => {
        e.preventDefault();
        saveSystemSettings({ 
            ...systemSettings,
            ...systemData, 
            lowStockThreshold: Number(systemData.lowStockThreshold),
            taxRate: Number(systemData.taxRate),
        });
        showToast(t('System settings saved'), 'success');
    };

    const handleAddCategory = (e: React.FormEvent) => {
        e.preventDefault();
        if (newCategoryName.trim() === '') {
            showToast('Category name cannot be empty', 'error');
            return;
        }
        if(addCategory(newCategoryName)) {
            setNewCategoryName('');
        }
    }

    const handleUpdateCategory = () => {
        if (editingCategory && updateCategory(editingCategory.oldName, editingCategory.newName)) {
            setEditingCategory(null);
        }
    }
    
    const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if(file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const data = JSON.parse(event.target?.result as string);
                    importData(data);
                } catch (error) {
                    showToast('Invalid JSON file', 'error');
                }
            };
            reader.readAsText(file);
            e.target.value = '';
        }
    };

    const handleChooseFolder = async () => {
        const folderName = await selectDirectory();
        if (folderName) {
            setStoragePath(folderName);
        }
    };

    const handleSaveStorage = () => {
        saveSystemSettings({
            ...systemSettings,
            storagePreference: storagePref,
            storagePath: storagePath
        });
        showToast('Storage preference saved.', 'success');
        if (storagePref === 'online') {
            showToast('Online folder sync is a placeholder for a future feature.', 'info');
        }
    };


    return (
        <div>
            <h2 className="text-3xl font-bold text-gray-900 mb-6">{t('settings_management')}</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Left Column */}
                <div className="space-y-6">
                    {/* Company Info */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('company_information')}</h3>
                        <form onSubmit={saveCompany} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">{t('company_name')}</label>
                                <input type="text" name="name" value={companyData.name} onChange={handleCompanyChange} className="w-full p-2 border rounded-lg mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('company_logo')}</label>
                                <input type="file" accept="image/*" onChange={handleCompanyLogoChange} className="w-full p-1 border rounded-lg mt-1" />
                            </div>
                             <div>
                                <label className="text-sm font-medium">{t('address')}</label>
                                <input type="text" name="address" value={companyData.address || ''} onChange={handleCompanyChange} className="w-full p-2 border rounded-lg mt-1" />
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('phone_number')}</label>
                                <input type="tel" name="phone" value={companyData.phone || ''} onChange={handleCompanyChange} className="w-full p-2 border rounded-lg mt-1" />
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-4 rounded-lg">{t('save_company_info')}</button>
                            </div>
                        </form>
                    </div>

                    {/* System Settings */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('system_settings')}</h3>
                        <form onSubmit={saveSystem} className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-sm font-medium">{t('business_type')}</label>
                                    <select name="businessType" value={systemData.businessType} onChange={handleSystemChange} className="w-full p-2 border rounded-lg mt-1">
                                        <option value="clothing">{t('clothing_business')}</option>
                                        <option value="pharmacy">{t('pharmacy_business')}</option>
                                        <option value="convenience">{t('convenience_business')}</option>
                                        <option value="hardware">{t('hardware_business')}</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('language')}</label>
                                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="w-full p-2 border rounded-lg mt-1">
                                        <option value="en">English</option>
                                        <option value="my">မြန်မာ</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('currency')}</label>
                                    <select name="currency" value={systemData.currency} onChange={handleSystemChange} className="w-full p-2 border rounded-lg mt-1">
                                        <option value="MMK">MMK</option>
                                        <option value="USD">USD</option>
                                        <option value="EUR">EUR</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('tax_rate')}</label>
                                    <input type="number" name="taxRate" value={systemData.taxRate} onChange={handleSystemChange} min="0" className="w-full p-2 border rounded-lg mt-1" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium">{t('low_stock_threshold')}</label>
                                    <input type="number" name="lowStockThreshold" value={systemData.lowStockThreshold} onChange={handleSystemChange} min="0" className="w-full p-2 border rounded-lg mt-1" />
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <label className="flex items-center space-x-2">
                                    <input type="checkbox" name="enableNotifications" checked={systemData.enableNotifications} onChange={handleSystemChange} />
                                    <span>{t('enable_notifications')}</span>
                                </label>
                                 <label className="flex items-center space-x-2">
                                    <input type="checkbox" name="enableSound" checked={systemData.enableSound} onChange={handleSystemChange} />
                                    <span>{t('enable_sound_effects')}</span>
                                </label>
                            </div>
                            <div className="flex justify-end">
                                <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-4 rounded-lg">{t('save_system_settings')}</button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    {/* Logo and Fair Use Policy */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <img src="https://i.postimg.cc/s217jBk2/Swift-POS.png" alt="Swift POS Logo" className="mx-auto h-24 w-auto" />
                        <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-sm text-gray-700">
                            <h4 className="font-bold text-center mb-2">Fair Use Policy – Swift POS</h4>
                            <p className="mb-2">
                                Swift POS is a proprietary software made publicly viewable on GitHub for learning, testing, and use within individual businesses. Users are permitted to download, modify, and use Swift POS for their own commercial operations; however, redistribution, resale, or rebranding of the software is strictly prohibited.
                            </p>
                            <p className="mb-2">
                                All implementations or modified versions must include visible attribution stating “Powered by Swift POS.” Swift POS is provided “as is,” without any warranty or guarantee of performance or suitability. Users operate and deploy the software at their own risk.
                            </p>
                            <p>
                                Swift POS is not designed to store or process data via cloud services. Users are responsible for managing their own data, either through local storage or personal cloud accounts. The developers of Swift POS do not collect, access, or retain any user data.
                            </p>
                        </div>
                    </div>

                     {/* Storage Preferences */}
                     <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('storage_preferences')}</h3>
                        <div className="space-y-4">
                            <div className="flex items-center space-x-6 border-b pb-4">
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="storagePref" 
                                        value="local" 
                                        checked={storagePref === 'local'} 
                                        onChange={(e) => setStoragePref(e.target.value as 'local' | 'online')}
                                        className="h-4 w-4 text-[--primary-color] focus:ring-[--primary-color] border-gray-300"
                                    />
                                    <span>{t('local_folder')}</span>
                                </label>
                                <label className="flex items-center space-x-2 cursor-pointer">
                                    <input 
                                        type="radio" 
                                        name="storagePref" 
                                        value="online" 
                                        checked={storagePref === 'online'} 
                                        onChange={(e) => setStoragePref(e.target.value as 'local' | 'online')}
                                        className="h-4 w-4 text-[--primary-color] focus:ring-[--primary-color] border-gray-300"
                                    />
                                    <span>{t('online_folder_url')}</span>
                                </label>
                            </div>

                            <div className="flex items-center space-x-2">
                                 <label htmlFor="storagePath" className="text-sm font-medium text-gray-700 whitespace-nowrap">{t('path_or_url')}</label>
                                 <input
                                    id="storagePath"
                                    type="text"
                                    value={storagePath}
                                    onChange={(e) => setStoragePath(e.target.value)}
                                    readOnly={storagePref === 'local'}
                                    placeholder={t('path_or_url_placeholder')}
                                    className="w-full p-2 border rounded-lg read-only:bg-gray-100 read-only:cursor-default"
                                 />
                                 <button
                                    onClick={handleChooseFolder}
                                    disabled={storagePref === 'online' || isInIframe || !isFileSystemApiSupported}
                                    className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded-lg disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                                 >
                                    {t('choose_folder')}
                                 </button>
                            </div>
                            {(isInIframe || !isFileSystemApiSupported) && storagePref === 'local' && (
                                <p className="text-xs text-yellow-800 bg-yellow-100 p-2 rounded-md -mt-2">
                                    {t(isFileSystemApiSupported ? 'folder_selection_disabled_in_environment' : 'Your browser does not support local folder access. Backups will be downloaded directly.')}
                                </p>
                            )}
                            
                            <div>
                                <button
                                    onClick={handleSaveStorage}
                                    className="bg-[--primary-color] hover:bg-[--primary-hover] text-white font-semibold py-2 px-6 rounded-lg"
                                >
                                    {t('save_storage_preference')}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Category Management */}
                    <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('Category Management')}</h3>
                        <form onSubmit={handleAddCategory} className="flex gap-2 mb-4">
                            <input 
                                type="text"
                                value={newCategoryName}
                                onChange={(e) => setNewCategoryName(e.target.value)}
                                placeholder={t('Enter new category name')}
                                className="flex-grow p-2 border rounded-lg"
                            />
                            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-semibold p-2 rounded-lg">{t('Add New Category')}</button>
                        </form>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                            {categories.map(c => (
                                <div key={c} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                                    <span>{c}</span>
                                    <div className="flex gap-2">
                                        <button onClick={() => setEditingCategory({ oldName: c, newName: c })} className="text-sm text-indigo-600">{t('Edit')}</button>
                                        <button onClick={() => deleteCategory(c)} className="text-sm text-red-600">{t('Delete')}</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    
                     {/* Receipt Settings */}
                     <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('receipt_settings')}</h3>
                        <form onSubmit={saveSystem} className="space-y-4">
                            <div>
                                <label className="text-sm font-medium">{t('receipt_size')}</label>
                                <select name="receiptSize" value={systemData.receiptSize} onChange={handleSystemChange} className="w-full p-2 border rounded-lg mt-1">
                                    <option value="standard">{t('standard_print')}</option>
                                    <option value="80mm">{t('thermal_80mm')}</option>
                                    <option value="58mm">{t('thermal_58mm')}</option>
                                </select>
                            </div>
                            <div>
                                <label className="text-sm font-medium">{t('receipt_footer_text')}</label>
                                <textarea name="receiptFooter" value={systemData.receiptFooter} onChange={handleSystemChange} rows={3} className="w-full p-2 border rounded-lg mt-1"></textarea>
                            </div>
                             <div className="flex justify-end">
                                <button type="submit" className="bg-[--primary-color] text-white font-semibold py-2 px-4 rounded-lg">{t('save_system_settings')}</button>
                            </div>
                        </form>
                    </div>

                     {/* Backup & Restore */}
                     <div className="bg-white rounded-lg p-6 shadow-md">
                        <h3 className="text-xl font-semibold mb-4">{t('data_management')}</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <button onClick={exportBackup} className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg">{t('export_backup_json')}</button>
                            <label className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg text-center cursor-pointer">
                                {t('import_backup_json')}
                                <input type="file" accept=".json" onChange={handleImportJson} className="hidden" />
                            </label>
                            <button onClick={resetAllData} className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg sm:col-span-2">{t('reset_data')}</button>
                        </div>
                     </div>
                </div>
            </div>

            {editingCategory && (
                <Modal isOpen={!!editingCategory} onClose={() => setEditingCategory(null)} title={t('Update Category')}>
                    <div className="space-y-4">
                        <label className="block text-sm font-medium">{t('Category Name')}</label>
                        <input 
                            type="text" 
                            value={editingCategory.newName} 
                            onChange={(e) => setEditingCategory({ ...editingCategory, newName: e.target.value })} 
                            className="w-full p-2 border rounded-lg"
                        />
                        <div className="flex justify-end gap-2">
                            <button onClick={() => setEditingCategory(null)} className="bg-gray-200 py-2 px-4 rounded-lg">{t('Cancel')}</button>
                            <button onClick={handleUpdateCategory} className="bg-[--primary-color] text-white py-2 px-4 rounded-lg">{t('Save')}</button>
                        </div>
                    </div>
                </Modal>
            )}
        </div>
    );
};

export default Settings;