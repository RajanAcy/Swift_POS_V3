
import React, { useEffect, useRef } from 'react';
import Modal from './Modal';
import { useLanguage } from '../../contexts/LanguageContext';
import { useData } from '../../contexts/DataContext';

declare var Quagga: any;

interface BarcodeScannerProps {
    isOpen: boolean;
    onClose: () => void;
    onDetected: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ isOpen, onClose, onDetected }) => {
    const { t } = useLanguage();
    const { showToast } = useData();
    const isScannerActive = useRef(false);

    useEffect(() => {
        if (isOpen && !isScannerActive.current) {
            isScannerActive.current = true;
            Quagga.init({
                inputStream: {
                    name: "Live",
                    type: "LiveStream",
                    target: '#barcode-scanner-container',
                    constraints: {
                        facingMode: "environment"
                    },
                },
                decoder: {
                    readers: [
                        "code_128_reader", "ean_reader", "ean_8_reader", "code_39_reader",
                        "codabar_reader", "upc_reader", "upc_e_reader"
                    ],
                },
            }, (err: any) => {
                if (err) {
                    console.error(err);
                    showToast('Error initializing barcode scanner.', 'error');
                    onClose();
                    return;
                }
                Quagga.start();
            });

            Quagga.onDetected(handleDetection);

        } else if (!isOpen && isScannerActive.current) {
            Quagga.offDetected(handleDetection);
            Quagga.stop();
            isScannerActive.current = false;
        }

        return () => {
            if (isScannerActive.current) {
                Quagga.offDetected(handleDetection);
                Quagga.stop();
                isScannerActive.current = false;
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen]);
    
    const handleDetection = (result: any) => {
        const code = result.codeResult.code;
        if (code) {
            onDetected(code);
        }
    }

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={t('scan_barcode_title')}>
            <div id="barcode-scanner-container" className="relative w-full aspect-video overflow-hidden">
                {/* Quagga will attach camera stream here */}
            </div>
        </Modal>
    );
};

export default BarcodeScanner;
