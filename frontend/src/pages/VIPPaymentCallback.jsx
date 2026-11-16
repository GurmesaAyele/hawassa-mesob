import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { API_CONFIG, resolveLocalizedValue } from '../config/api';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const VIPPaymentCallback = () => {
  const [language, setLanguage] = useState('English');
  const [status, setStatus] = useState('loading'); // loading, success, failed, timeout
  const [paymentData, setPaymentData] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [pollingAttempts, setPollingAttempts] = useState(0);
  const [supplementaryServices, setSupplementaryServices] = useState([]);
  const [citizenInfo, setCitizenInfo] = useState({ name: '', phone: '' });
  const [copiedToast, setCopiedToast] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [zoom, setZoom] = useState(1);

  const maxPollingAttempts = 20; // 60 seconds (3 seconds × 20)
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Refs for cleanup and preventing overlapping polls
  const pollingIntervalRef = useRef(null);
  const isPollingRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    const handleLanguageChange = (event) => {
      setLanguage(event.detail);
    };

    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage) {
      setLanguage(savedLanguage);
    }

    // Try reading any locally preserved ticket details from the form submission
    try {
      const savedServices = localStorage.getItem('vip_selected_services');
      if (savedServices) {
        const parsed = JSON.parse(savedServices);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setSupplementaryServices(parsed);
        }
      }
      const savedName = localStorage.getItem('vip_citizen_name');
      const savedPhone = localStorage.getItem('vip_citizen_phone');
      if (savedName || savedPhone) {
        setCitizenInfo({ name: savedName || '', phone: savedPhone || '' });
      }
    } catch (e) {
      console.warn('Could not read cached VIP ticket details from localStorage:', e);
    }

    window.addEventListener('languageChange', handleLanguageChange);
    return () => window.removeEventListener('languageChange', handleLanguageChange);
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // Get application reference from multiple sources (Priority: URL params > localStorage)
    const reference = searchParams.get('reference') ||
                      searchParams.get('trx_ref') ||
                      searchParams.get('tx_ref') ||
                      localStorage.getItem('vip_application_reference');

    if (!reference) {
      setStatus('failed');
      setErrorMessage('No payment session found. Please start a new VIP application.');
      return;
    }

    console.log('Payment callback initiated for reference:', reference);

    let pollCount = 0;

    const pollPaymentStatus = async () => {
      if (isPollingRef.current) {
        return;
      }

      isPollingRef.current = true;
      pollCount++;

      if (isMountedRef.current) {
        setPollingAttempts(pollCount);
      }

      if (pollCount > maxPollingAttempts) {
        clearInterval(pollingIntervalRef.current);
        isPollingRef.current = false;

        if (isMountedRef.current) {
          setStatus('timeout');
          setErrorMessage('Payment verification is taking longer than expected. You can check your status later.');
        }
        return;
      }

      try {
        const response = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_PAYMENTS_STATUS}/${encodeURIComponent(reference)}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            cache: 'no-store'
          }
        );

        if (!response.ok) {
          if (response.status === 404) {
            // Fallback: If payment session not found, check if direct ticket reference exists
            try {
              const ticketRes = await fetch(
                `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_TICKETS_REFERENCE}/${encodeURIComponent(reference)}`
              );
              if (ticketRes.ok) {
                const ticketData = await ticketRes.json();
                if (ticketData.success && ticketData.data) {
                  const td = ticketData.data;
                  clearInterval(pollingIntervalRef.current);
                  isPollingRef.current = false;
                  if (isMountedRef.current) {
                    setPaymentData({
                      applicationReference: td.ticketCode || td.reference,
                      ticketCode: td.ticketCode || td.reference,
                      ticketStatus: td.status || 'CONFIRMED',
                      amount: td.vipFee || 1000,
                      currency: td.currency || 'ETB',
                      paymentMethod: td.paymentMethod || 'Chapa',
                      qrCodeUrl: td.qrCodeUrl,
                      citizenName: td.citizenName,
                      citizenPhone: td.citizenPhone,
                      services: td.services || [],
                      isConfirmed: true
                    });
                    setStatus('success');
                  }
                  return;
                }
              }
            } catch (fallbackErr) {
              console.warn('Fallback ticket reference check failed:', fallbackErr);
            }

            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;

            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage('Payment session not found. The reference may be invalid.');
            }
            return;
          } else if (response.status === 304) {
            isPollingRef.current = false;
            return;
          } else {
            console.warn(`HTTP ${response.status} error during polling, will retry...`);
            isPollingRef.current = false;
            return;
          }
        }

        const result = await response.json();

        if (result.success && result.data) {
          const data = result.data;

          if (isMountedRef.current) {
            setPaymentData(data);
            if (Array.isArray(data.services) && data.services.length > 0) {
              setSupplementaryServices(data.services);
            }
            if (data.citizenName || data.citizenPhone) {
              setCitizenInfo((prev) => ({
                name: data.citizenName || prev.name,
                phone: data.citizenPhone || prev.phone
              }));
            }
          }

          // Stop polling immediately on confirmation or completed ticket statuses
          const isConfirmed = data.isConfirmed ||
            ['CONFIRMED', 'QUEUED', 'SERVING', 'USED'].includes(data.ticketStatus) ||
            data.paymentStatus === 'SUCCESS';

          if (isConfirmed) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;

            if (isMountedRef.current) {
              setStatus('success');
              localStorage.removeItem('vip_application_reference');
            }
            return;
          }

          if (data.isPending) {
            isPollingRef.current = false;
            return;
          }

          if (!data.canRetry) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;

            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage(data.errorMessage || 'Payment was not completed.');
            }
            return;
          }

          if (data.canRetry) {
            clearInterval(pollingIntervalRef.current);
            isPollingRef.current = false;

            if (isMountedRef.current) {
              setStatus('failed');
              setErrorMessage(data.errorMessage || 'Payment was not completed. Please try again.');
            }
            return;
          }
        } else if (!result.success) {
          clearInterval(pollingIntervalRef.current);
          isPollingRef.current = false;

          if (isMountedRef.current) {
            setStatus('failed');
            setErrorMessage(result.error || result.message || 'Unable to verify payment status.');
          }
          return;
        }

        isPollingRef.current = false;
      } catch (error) {
        console.error('Error checking payment status:', error);
        isPollingRef.current = false;
      }
    };

    pollPaymentStatus();
    pollingIntervalRef.current = setInterval(pollPaymentStatus, 3000);

    return () => {
      isMountedRef.current = false;
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
      isPollingRef.current = false;
    };
  }, [searchParams]);

  // Supplementary fetch for ticket services and details
  useEffect(() => {
    const activeRef = paymentData?.applicationReference ||
                      paymentData?.ticketCode ||
                      searchParams.get('reference') ||
                      searchParams.get('trx_ref') ||
                      searchParams.get('tx_ref');

    if (!activeRef) return;

    let isSubscribed = true;
    const fetchTicket = async () => {
      try {
        const res = await fetch(
          `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIP_TICKETS_REFERENCE}/${encodeURIComponent(activeRef)}`
        );
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data && isSubscribed) {
            if (Array.isArray(json.data.services) && json.data.services.length > 0) {
              setSupplementaryServices(json.data.services);
            }
            if (json.data.citizenName || json.data.citizenPhone) {
              setCitizenInfo((prev) => ({
                name: json.data.citizenName || prev.name,
                phone: json.data.citizenPhone || prev.phone
              }));
            }
          }
        }
      } catch (err) {
        console.warn('Supplementary ticket fetch note:', err);
      }
    };

    fetchTicket();
    return () => { isSubscribed = false; };
  }, [paymentData?.applicationReference, paymentData?.ticketCode, searchParams]);

  const handleRetry = () => {
    navigate('/vip');
  };

  const handleGoHome = () => {
    localStorage.removeItem('vip_application_reference');
    localStorage.removeItem('vip_selected_services');
    localStorage.removeItem('vip_citizen_name');
    localStorage.removeItem('vip_citizen_phone');
    navigate('/');
  };

  const generateAndDownloadTicket = async () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = 800;
    const servicesCount = displayServices.length || 1;
    const serviceSlotHeight = 76;
    const servicesTotalHeight = servicesCount * serviceSlotHeight;
    const citizenExtra = displayCitizenName ? 65 : 0;
    const height = 1140 + servicesTotalHeight + citizenExtra;

    canvas.width = width;
    canvas.height = height;

    const drawRoundedRect = (c, x, y, w, h, r) => {
      c.beginPath();
      if (c.roundRect) {
        c.roundRect(x, y, w, h, r);
      } else {
        c.moveTo(x + r, y);
        c.lineTo(x + w - r, y);
        c.quadraticCurveTo(x + w, y, x + w, y + r);
        c.lineTo(x + w, y + h - r);
        c.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        c.lineTo(x + r, y + h);
        c.quadraticCurveTo(x, y + h, x, y + h - r);
        c.lineTo(x, y + r);
        c.quadraticCurveTo(x, y, x + r, y);
      }
    };

    // Card background - pure white
    ctx.fillStyle = '#FFFFFF';
    drawRoundedRect(ctx, 0, 0, width, height, 44);
    ctx.fill();

    // Gold outer border
    ctx.strokeStyle = '#CB9D2A';
    ctx.lineWidth = 6;
    drawRoundedRect(ctx, 3, 3, width - 6, height - 6, 42);
    ctx.stroke();

    // VIP TICKET title
    ctx.fillStyle = '#B8860B';
    ctx.font = '900 46px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('VIP TICKET', 52, 90);

    // CONFIRMED status badge
    ctx.fillStyle = '#ECFDF5';
    drawRoundedRect(ctx, width - 240, 48, 188, 52, 26);
    ctx.fill();
    ctx.strokeStyle = '#34D399';
    ctx.lineWidth = 2.5;
    ctx.stroke();
    ctx.fillStyle = '#047857';
    ctx.font = '800 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CONFIRMED', width - 146, 82);

    // Application Reference
    ctx.textAlign = 'left';
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 20px sans-serif';
    ctx.fillText('APPLICATION REFERENCE', 52, 160);

    const refText = resolveLocalizedValue(paymentData.applicationReference || paymentData.ticketCode || searchParams.get('reference'), language) || 'VIP-MESOB';
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 36px monospace';
    ctx.fillText(refText, 52, 205);

    // Amount & Payment Method
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 20px sans-serif';
    ctx.fillText('AMOUNT', 52, 268);
    ctx.fillText('PAYMENT METHOD', 440, 268);

    ctx.fillStyle = '#0F172A';
    ctx.font = '800 32px sans-serif';
    ctx.fillText(`${paymentData.amount || 1000} ${paymentData.currency || 'ETB'}`, 52, 310);
    ctx.fillText(`${resolveLocalizedValue(paymentData.paymentMethod || 'Test', language)}`, 440, 310);

    let currentY = 360;

    // Citizen Name (if present)
    if (displayCitizenName) {
      ctx.strokeStyle = '#F1F5F9';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(52, currentY - 15);
      ctx.lineTo(width - 52, currentY - 15);
      ctx.stroke();

      ctx.fillStyle = '#94A3B8';
      ctx.font = '700 20px sans-serif';
      ctx.fillText('CITIZEN NAME', 52, currentY + 16);
      ctx.fillStyle = '#1E293B';
      ctx.font = '700 26px sans-serif';
      ctx.fillText(resolveLocalizedValue(displayCitizenName, language), 240, currentY + 16);
      currentY += 56;
    }

    // Divider
    ctx.strokeStyle = '#F1F5F9';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(52, currentY);
    ctx.lineTo(width - 52, currentY);
    ctx.stroke();
    currentY += 36;

    // Selected Services Label
    ctx.fillStyle = '#64748B';
    ctx.font = '800 22px sans-serif';
    ctx.fillText(`SELECTED SERVICES (${displayServices.length || 1})`, 52, currentY);
    currentY += 22;

    // Render each service
    if (displayServices.length > 0) {
      displayServices.forEach((s) => {
        currentY += 14;
        ctx.fillStyle = '#FFFBEB';
        drawRoundedRect(ctx, 52, currentY, width - 104, 62, 16);
        ctx.fill();
        ctx.strokeStyle = '#FDE68A';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        // Gold check circle
        ctx.fillStyle = '#CB9D2A';
        ctx.beginPath();
        ctx.arc(88, currentY + 31, 16, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FFFFFF';
        ctx.font = '800 18px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('✓', 88, currentY + 37);

        // Service title & institution name
        ctx.textAlign = 'left';
        ctx.fillStyle = '#0F172A';
        const title = resolveLocalizedValue(s.title, language) || resolveLocalizedValue(s.name, language) || 'VIP Service';
        const providerName = s.provider?.name
          ? resolveLocalizedValue(s.provider.name, language)
          : (s.institutionName ? resolveLocalizedValue(s.institutionName, language) : '');

        if (providerName) {
          ctx.font = '700 20px sans-serif';
          const truncated = title.length > 38 ? title.slice(0, 36) + '...' : title;
          ctx.fillText(truncated, 120, currentY + 27);

          ctx.fillStyle = '#92400E';
          ctx.font = '600 15px sans-serif';
          const truncInst = providerName.length > 44 ? providerName.slice(0, 42) + '...' : providerName;
          ctx.fillText(truncInst, 120, currentY + 49);
        } else {
          ctx.font = '700 22px sans-serif';
          const truncated = title.length > 40 ? title.slice(0, 38) + '...' : title;
          ctx.fillText(truncated, 120, currentY + 38);
        }

        currentY += 62;
      });
    } else {
      currentY += 14;
      ctx.fillStyle = '#FFFBEB';
      drawRoundedRect(ctx, 52, currentY, width - 104, 54, 16);
      ctx.fill();
      ctx.fillStyle = '#92400E';
      ctx.font = '700 20px sans-serif';
      ctx.fillText('✦ Fast-track VIP Service & Priority Queue Access', 74, currentY + 34);
      currentY += 54;
    }

    currentY += 40;

    // Perforation divider with side notches
    const notchY = currentY;
    // Left notch
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(0, notchY, 34, -Math.PI / 2, Math.PI / 2);
    ctx.fill();
    ctx.strokeStyle = '#CB9D2A';
    ctx.lineWidth = 6;
    ctx.stroke();

    // Right notch
    ctx.beginPath();
    ctx.arc(width, notchY, 34, Math.PI / 2, -Math.PI / 2);
    ctx.fill();
    ctx.stroke();

    // Perforation dots
    ctx.fillStyle = '#E2E8F0';
    for (let x = 68; x <= width - 68; x += 30) {
      ctx.beginPath();
      ctx.arc(x, notchY, 5, 0, Math.PI * 2);
      ctx.fill();
    }

    currentY += 52;

    // Digital Ticket Title
    ctx.textAlign = 'center';
    ctx.fillStyle = '#1E293B';
    ctx.font = '800 32px sans-serif';
    ctx.fillText('Your Digital VIP Ticket', width / 2, currentY);
    currentY += 25;

    // Load QR Image
    if (qrCodeSrc) {
      try {
        const qrImg = await new Promise((resolve) => {
          const img = new Image();
          img.crossOrigin = 'anonymous';
          const tId = setTimeout(() => resolve(null), 1500);
          img.onload = () => { clearTimeout(tId); resolve(img); };
          img.onerror = () => { clearTimeout(tId); resolve(null); };
          img.src = qrCodeSrc;
        });

        if (qrImg) {
          const qrSize = 320;
          const qrX = (width - qrSize) / 2;
          const qrY = currentY + 15;

          // QR container box
          ctx.fillStyle = '#FFFFFF';
          drawRoundedRect(ctx, qrX - 16, qrY - 16, qrSize + 32, qrSize + 32, 22);
          ctx.fill();
          ctx.strokeStyle = '#F1F5F9';
          ctx.lineWidth = 2;
          ctx.stroke();

          // Gold corner brackets
          const bl = 28;
          const x1 = qrX - 8;
          const x2 = qrX + qrSize + 8;
          const y1 = qrY - 8;
          const y2 = qrY + qrSize + 8;

          ctx.strokeStyle = '#CB9D2A';
          ctx.lineWidth = 6;
          ctx.lineCap = 'round';

          // ┌
          ctx.beginPath();
          ctx.moveTo(x1, y1 + bl); ctx.lineTo(x1, y1); ctx.lineTo(x1 + bl, y1); ctx.stroke();
          // ┐
          ctx.beginPath();
          ctx.moveTo(x2 - bl, y1); ctx.lineTo(x2, y1); ctx.lineTo(x2, y1 + bl); ctx.stroke();
          // └
          ctx.beginPath();
          ctx.moveTo(x1, y2 - bl); ctx.lineTo(x1, y2); ctx.lineTo(x1 + bl, y2); ctx.stroke();
          // ┘
          ctx.beginPath();
          ctx.moveTo(x2 - bl, y2); ctx.lineTo(x2, y2); ctx.lineTo(x2, y2 - bl); ctx.stroke();

          ctx.drawImage(qrImg, qrX, qrY, qrSize, qrSize);
          currentY = qrY + qrSize + 48;
        } else {
          currentY += 100;
        }
      } catch (err) {
        console.warn('QR draw skipped:', err);
        currentY += 100;
      }
    }

    // Check-in text
    ctx.fillStyle = '#64748B';
    ctx.font = '600 22px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Please check in at Hawassa MESOB Center to join the priority queue', width / 2, currentY);

    // Footer note
    ctx.fillStyle = '#94A3B8';
    ctx.font = '700 18px sans-serif';
    ctx.fillText('Hawassa MESOB Center • Priority Pass', width / 2, currentY + 36);

    // Convert canvas to Blob and download
    canvas.toBlob((blob) => {
      if (!blob) return;
      const blobUrl = URL.createObjectURL(blob);
      const downloadAnchor = document.createElement('a');
      downloadAnchor.href = blobUrl;
      downloadAnchor.download = `VIP-Ticket-${refText}.png`;
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      document.body.removeChild(downloadAnchor);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 4000);
    }, 'image/png');
  };

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
      await generateAndDownloadTicket();
    } catch (e) {
      console.error('Download ticket error:', e);
    } finally {
      setIsDownloading(false);
      // Automatically prompt print dialog so user can also print directly
      setTimeout(() => {
        window.print();
      }, 500);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleSharePass = async () => {
    const refCode = paymentData?.applicationReference || paymentData?.ticketCode || searchParams.get('reference') || '';
    const shareUrl = window.location.href;
    const shareData = {
      title: 'VIP Ticket Pass - Hawassa MESOB',
      text: `Hawassa MESOB VIP Ticket: ${refCode}`,
      url: shareUrl
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        return;
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.warn('Share error:', err);
        }
      }
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopiedToast(true);
      setTimeout(() => setCopiedToast(false), 3000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  // Translations
  const translations = {
    English: {
      loading: 'Confirming Your Payment',
      loadingDesc: 'Please wait while we verify your payment with the bank...',
      success: 'Payment Successful',
      successDesc: 'Your VIP ticket has been issued successfully',
      failed: 'Payment Failed',
      timeout: 'Payment Verification Timeout',
      retry: 'Try Again',
      goHome: 'Back to Home',
      applicationRef: 'Application Reference',
      ticketCode: 'Ticket Code',
      ticketStatus: 'Ticket Status',
      amount: 'Amount',
      paymentMethod: 'Payment Method',
      checkInInstructions: 'Please check in at Hawassa MESOB Center to join the priority queue',
      checkStatusLater: 'Check Status Later',
      verificationAttempt: 'Verification attempt',
      digitalTicket: 'Your Digital VIP Ticket',
      vipTicket: 'VIP TICKET',
      confirmed: 'CONFIRMED',
      selectedServices: 'Selected Services',
      servicesCount: 'services',
      citizenName: 'Citizen Name',
      downloadPdf: 'Download PDF',
      downloading: 'Downloading...',
      printTicket: 'Print',
      sharePass: 'Share Pass',
      passCopied: 'Pass link copied to clipboard!',
      fastTrackQueue: 'Priority Fast-Track Queue Pass'
    },
    Amharic: {
      loading: 'ክፍያዎን በማረጋገጥ ላይ',
      loadingDesc: 'እባክዎ ክፍያዎን ከባንክ ጋር ስናረጋግጥ ይጠብቁ...',
      success: 'ክፍያ ተሳክቷል',
      successDesc: 'የቪአይፒ ትኬትዎ በተሳካ ሁኔታ ተሰጥቷል',
      failed: 'ክፍያ አልተሳካም',
      timeout: 'የክፍያ ማረጋገጫ ጊዜ አልቋል',
      retry: 'እንደገና ይሞክሩ',
      goHome: 'ወደ መነሻ ተመለስ',
      applicationRef: 'የማመልከቻ ማጣቀሻ',
      ticketCode: 'የትኬት ኮድ',
      ticketStatus: 'የትኬት ሁኔታ',
      amount: 'መጠን',
      paymentMethod: 'የክፍያ ዘዴ',
      checkInInstructions: 'እባክዎ በሀዋሳ መሶብ ማዕከል ተመዝግበው ወደ ቅድሚያ ወረፋ ይቀላቀሉ',
      checkStatusLater: 'ሁኔታውን በኋላ ያረጋግጡ',
      verificationAttempt: 'የማረጋገጫ ሙከራ',
      digitalTicket: 'የእርስዎ ዲጂታል ቪአይፒ ትኬት',
      vipTicket: 'ቪአይፒ ትኬት',
      confirmed: 'ተረጋግጧል',
      selectedServices: 'የተመረጡ አገልግሎቶች',
      servicesCount: 'አገልግሎቶች',
      citizenName: 'የዜጋው ስም',
      downloadPdf: 'ፒዲኤፍ አውርድ',
      downloading: 'በማውረድ ላይ...',
      printTicket: 'አትም',
      sharePass: 'ትኬቱን አጋራ',
      passCopied: 'የትኬት አገናኝ ተቀድቷል!',
      fastTrackQueue: 'የቅድሚያ ፈጣን ወረፋ ትኬት'
    },
    Sidama: {
      loading: 'Kaffaltira Mirkaneessa',
      loadingDesc: 'Kaffaltira baanki waliin mirkaneessano giddo wole...',
      success: 'Kaffaltii Milkaae',
      successDesc: 'VIP tiketira milkaaninsa kennama',
      failed: 'Kaffaltii Dandaabokki',
      timeout: 'Kaffaltii Mirkanee Yeroo Xumurame',
      retry: 'Ammas Yaala',
      goHome: 'Manatti Deema',
      applicationRef: 'Maalifinsa Refereensa',
      ticketCode: 'Tiketi Kooda',
      ticketStatus: 'Tiketi Haala',
      amount: 'Hanga',
      paymentMethod: 'Kaffaltii Mala',
      checkInInstructions: 'Hawassa MESOB Seentera ware priority queue gede haa',
      checkStatusLater: 'Haala Boodatti Ilaali',
      verificationAttempt: 'Mirkanee yaala',
      digitalTicket: 'Kee Digital VIP Tiketi',
      vipTicket: 'VIP TIKETI',
      confirmed: 'MIRKANAABBE',
      selectedServices: 'Dooramino Owaante',
      servicesCount: 'owaante',
      citizenName: 'Teessaancho Su’ma',
      downloadPdf: 'PDF Buusi',
      downloading: 'Buusanni...',
      printTicket: 'Attami',
      sharePass: 'Tikete Qoodi',
      passCopied: 'Tikete linke koppinammooni!',
      fastTrackQueue: 'Priority Fast-Track Tikete'
    }
  };

  const t = translations[language] || translations.English;

  // Resolve services to display - aggregates paymentData, supplementaryServices, and localStorage
  const displayServices = (() => {
    const list = [];
    const seen = new Set();
    const add = (s) => {
      if (!s) return;
      const id = s.id || (typeof s === 'string' ? s : null);
      const title = resolveLocalizedValue(s.title, language) || resolveLocalizedValue(s.name, language) || (typeof s === 'string' ? s : '');
      const key = id || title;
      if (key && !seen.has(key)) {
        seen.add(key);
        list.push(s);
      }
    };
    if (Array.isArray(paymentData?.services)) {
      paymentData.services.forEach(add);
    }
    if (Array.isArray(supplementaryServices)) {
      supplementaryServices.forEach(add);
    }
    try {
      const stored = JSON.parse(localStorage.getItem('vip_selected_services') || '[]');
      if (Array.isArray(stored)) {
        stored.forEach(add);
      }
    } catch (e) {}
    return list;
  })();

  const displayCitizenName = paymentData?.citizenName || citizenInfo.name || '';

  // Resolving QR Code Source
  const qrCodeSrc = paymentData?.qrCodeUrl ||
    (paymentData?.applicationReference || paymentData?.ticketCode || searchParams.get('reference')
      ? `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(paymentData?.applicationReference || paymentData?.ticketCode || searchParams.get('reference'))}`
      : null);

  return (
    <div className="min-h-screen bg-[#1E293B]">
      {/* Print Stylesheet for clean ticket printing */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #vip-ticket-card, #vip-ticket-card * {
            visibility: visible !important;
          }
          #vip-ticket-card {
            position: absolute !important;
            left: 50% !important;
            top: 20px !important;
            transform: translateX(-50%) !important;
            width: 100% !important;
            max-width: 360px !important;
            margin: 0 auto !important;
            box-shadow: none !important;
            border: 2px solid #CB9D2A !important;
            background: #ffffff !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <Navbar />

      <div className="pt-24 px-4 sm:px-6 pb-12 min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full">
          {/* Loading State */}
          {status === 'loading' && (
            <div className="bg-[#2D3748] rounded-2xl p-12 text-center shadow-xl">
              <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-[#CB9D2A] mx-auto mb-6"></div>
              <h2 className="text-3xl font-bold text-white mb-3">{t.loading}</h2>
              <p className="text-gray-400 mb-6">{t.loadingDesc}</p>
              <p className="text-sm text-gray-500">
                {t.verificationAttempt} {pollingAttempts} / {maxPollingAttempts}
              </p>
            </div>
          )}

          {/* Success State */}
          {status === 'success' && paymentData && (
            <div className="w-full flex flex-col items-center">
              {/* Header outside the card */}
              <div className="text-center mb-5 no-print">
                <div className="w-12 h-12 rounded-full mx-auto mb-2.5 flex items-center justify-center bg-gradient-to-tr from-[#CB9D2A] to-[#E6CA65] shadow-lg shadow-[#CB9D2A]/25">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">{t.success}</h2>
                <p className="text-slate-400 text-sm mt-1">{t.successDesc}</p>
              </div>

              {/* Zoom In & Out Toolbar */}
              <div className="flex items-center justify-center gap-2 mb-4 no-print select-none">
                <div className="inline-flex items-center bg-slate-800/90 backdrop-blur-md border border-slate-700/80 rounded-full px-3 py-1 shadow-lg text-white text-xs gap-2">
                  <button
                    type="button"
                    onClick={() => setZoom(prev => Math.max(0.65, Number((prev - 0.1).toFixed(1))))}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                    title="Zoom Out"
                    aria-label="Zoom Out"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M20 12H4" />
                    </svg>
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="px-2 py-0.5 font-mono font-bold text-[11px] text-[#CB9D2A] hover:bg-white/10 rounded transition-colors"
                    title="Reset to 100%"
                  >
                    {Math.round(zoom * 100)}%
                  </button>

                  <button
                    type="button"
                    onClick={() => setZoom(prev => Math.min(1.4, Number((prev + 0.1).toFixed(1))))}
                    className="p-1 hover:bg-white/10 rounded-full transition-colors text-slate-300 hover:text-white"
                    title="Zoom In"
                    aria-label="Zoom In"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                    </svg>
                  </button>

                  <div className="h-3 w-px bg-slate-600/70 mx-0.5"></div>

                  <button
                    type="button"
                    onClick={() => setZoom(1)}
                    className="text-[10px] font-semibold text-slate-400 hover:text-white transition-colors"
                    title="Reset Zoom"
                  >
                    Reset
                  </button>
                </div>
              </div>

              {/* VIP Ticket Card Container with Zoom Scale */}
              <div className="w-full flex justify-center items-start overflow-visible transition-all duration-200">
                <div
                  id="vip-ticket-card"
                  style={{
                    transform: `scale(${zoom})`,
                    transformOrigin: 'top center',
                    transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  className="relative w-full max-w-[340px] sm:max-w-[360px] bg-white rounded-3xl border-2 border-[#CB9D2A] shadow-[0_20px_50px_-15px_rgba(0,0,0,0.5)] overflow-hidden text-slate-900 mx-auto transition-all"
                >
                  {/* Top Section */}
                  <div className="p-4 sm:p-5 pb-2.5">
                    {/* VIP TICKET & CONFIRMED Status Badge */}
                    <div className="flex items-center justify-between">
                      <h1 className="text-xl sm:text-2xl font-black tracking-wider text-[#B8860B] drop-shadow-sm font-sans uppercase">
                        {t.vipTicket}
                      </h1>
                      <span className="bg-emerald-50 text-emerald-700 border border-emerald-400/80 font-bold text-[10px] sm:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                        {t.confirmed}
                      </span>
                    </div>

                    {/* Application Reference */}
                    <div className="mt-3.5 text-left">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                        {t.applicationRef}
                      </p>
                      <p className="text-base sm:text-lg font-mono font-extrabold text-slate-900 tracking-tight break-all select-all">
                        {resolveLocalizedValue(paymentData.applicationReference || paymentData.ticketCode || searchParams.get('reference'), language)}
                      </p>
                    </div>

                    {/* Amount & Payment Method */}
                    <div className="grid grid-cols-2 gap-3 mt-3 pt-1 text-left">
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                          {t.amount}
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900">
                          {paymentData.amount || 1000} {paymentData.currency || 'ETB'}
                        </p>
                      </div>
                      <div>
                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">
                          {t.paymentMethod}
                        </p>
                        <p className="text-xs sm:text-sm font-extrabold text-slate-900 capitalize truncate">
                          {resolveLocalizedValue(paymentData.paymentMethod || 'Chapa', language)}
                        </p>
                      </div>
                    </div>

                    {/* Citizen Name (if present) */}
                    {displayCitizenName && (
                      <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between text-left">
                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">
                          {t.citizenName}
                        </span>
                        <span className="text-xs font-bold text-slate-800 truncate ml-2">
                          {resolveLocalizedValue(displayCitizenName, language)}
                        </span>
                      </div>
                    )}

                    {/* Selected Services Section - Shows ALL services from all institutions */}
                    <div className="mt-3 pt-2.5 border-t border-gray-100 text-left">
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
                          <svg className="w-3 h-3 text-[#CB9D2A]" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                          </svg>
                          {t.selectedServices}
                        </span>
                        {displayServices.length > 0 && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800">
                            {displayServices.length} {t.servicesCount}
                          </span>
                        )}
                      </div>

                      {displayServices.length > 0 ? (
                        <div className="space-y-1.5">
                          {displayServices.map((service, idx) => {
                            const serviceTitle = resolveLocalizedValue(service.title, language) ||
                                                 resolveLocalizedValue(service.name, language) ||
                                                 'VIP Service';
                            const providerName = service.provider?.name
                              ? resolveLocalizedValue(service.provider.name, language)
                              : (service.institutionName ? resolveLocalizedValue(service.institutionName, language) : '');
                            const floorRoom = service.provider?.floorRoomNumber
                              ? resolveLocalizedValue(service.provider.floorRoomNumber, language)
                              : '';

                            return (
                              <div
                                key={service.id || idx}
                                className="bg-amber-50/70 border border-amber-200/80 rounded-lg p-1.5 flex items-center gap-2 text-left"
                              >
                                <span className="w-3.5 h-3.5 rounded-full bg-[#CB9D2A] text-white flex items-center justify-center text-[8px] font-black flex-shrink-0">
                                  ✓
                                </span>
                                <div className="min-w-0 flex-1">
                                  <p className="text-[11px] sm:text-xs font-bold text-slate-900 leading-tight truncate">
                                    {serviceTitle}
                                  </p>
                                  {providerName && (
                                    <p className="text-[9px] text-amber-800/90 font-semibold truncate">
                                      {providerName}
                                      {floorRoom && <span className="ml-1 text-slate-500">• {floorRoom}</span>}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-amber-50/60 border border-amber-200/60 rounded-lg p-1.5 text-[11px] text-amber-900 flex items-center gap-1.5">
                          <span className="text-[#CB9D2A] font-bold">✦</span>
                          <span>{t.fastTrackQueue}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Perforated Divider with Cutout Notches */}
                  <div className="relative py-1 flex items-center justify-center my-0 select-none">
                    <div className="absolute -left-3 w-6 h-6 bg-[#1E293B] rounded-full border-r-2 border-[#CB9D2A] -translate-y-1/2 top-1/2 z-10 shadow-inner"></div>
                    <div className="w-full flex items-center justify-between px-5 overflow-hidden">
                      {Array.from({ length: 20 }).map((_, i) => (
                        <span key={i} className="w-1.5 h-1.5 rounded-full bg-gray-200 inline-block flex-shrink-0 mx-0.5"></span>
                      ))}
                    </div>
                    <div className="absolute -right-3 w-6 h-6 bg-[#1E293B] rounded-full border-l-2 border-[#CB9D2A] -translate-y-1/2 top-1/2 z-10 shadow-inner"></div>
                  </div>

                  {/* Bottom Section */}
                  <div className="p-4 sm:p-5 pt-2.5 bg-white text-center">
                    <p className="text-xs font-bold text-slate-800 mb-2">
                      {t.digitalTicket}
                    </p>

                    {/* QR Code Container with 4 Corner Scanner Brackets */}
                    <div className="relative inline-block mx-auto p-3 bg-white rounded-xl shadow-sm border border-gray-100">
                      <span className="absolute top-1.5 left-1.5 w-4 h-4 border-t-2 border-l-2 border-[#CB9D2A] rounded-tl-sm pointer-events-none"></span>
                      <span className="absolute top-1.5 right-1.5 w-4 h-4 border-t-2 border-r-2 border-[#CB9D2A] rounded-tr-sm pointer-events-none"></span>
                      <span className="absolute bottom-1.5 left-1.5 w-4 h-4 border-b-2 border-l-2 border-[#CB9D2A] rounded-bl-sm pointer-events-none"></span>
                      <span className="absolute bottom-1.5 right-1.5 w-4 h-4 border-b-2 border-r-2 border-[#CB9D2A] rounded-br-sm pointer-events-none"></span>

                      {qrCodeSrc ? (
                        <img
                          src={qrCodeSrc}
                          alt="VIP Ticket QR Code"
                          className="w-28 h-28 sm:w-32 sm:h-32 object-contain mx-auto"
                        />
                      ) : (
                        <div className="w-28 h-28 sm:w-32 sm:h-32 flex items-center justify-center bg-gray-50 rounded-lg text-gray-400 text-xs">
                          QR Code
                        </div>
                      )}
                    </div>

                    {/* Check-in Instructions */}
                    <p className="text-[10px] text-gray-500 leading-tight max-w-[240px] mx-auto mt-2.5 mb-3.5 flex items-center justify-center gap-1">
                      <span>{t.checkInInstructions}</span>
                      <span className="w-3.5 h-3.5 rounded-full border border-gray-400 text-gray-500 text-[9px] font-bold flex items-center justify-center flex-shrink-0">
                        i
                      </span>
                    </p>

                    {/* Bottom Action Buttons */}
                    <div className="flex flex-row gap-2 no-print">
                      <button
                        onClick={handleDownloadPdf}
                        disabled={isDownloading}
                        className="flex-1 py-2 px-2.5 rounded-xl font-bold bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98] disabled:opacity-75"
                      >
                        {isDownloading ? (
                          <div className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-amber-400 border-t-transparent" />
                        ) : (
                          <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                          </svg>
                        )}
                        <span>{isDownloading ? t.downloading : t.downloadPdf}</span>
                      </button>

                      <button
                        onClick={handlePrint}
                        className="py-2 px-2.5 rounded-xl font-bold bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98]"
                        title="Print ticket pass"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                        </svg>
                        <span>{t.printTicket}</span>
                      </button>

                      <button
                        onClick={handleSharePass}
                        className="py-2 px-2.5 rounded-xl font-bold bg-[#1E293B] hover:bg-[#0F172A] text-white text-xs transition-all duration-200 flex items-center justify-center gap-1.5 shadow-md hover:shadow-lg active:scale-[0.98]"
                      >
                        <svg className="w-3.5 h-3.5 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                        </svg>
                        <span>{t.sharePass}</span>
                      </button>
                    </div>

                    {/* Copy Link Feedback Toast */}
                    {copiedToast && (
                      <div className="mt-2 text-xs text-emerald-600 font-semibold no-print">
                        {t.passCopied}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Return to Home link below the card */}
              <div className="mt-6 text-center no-print">
                <button
                  onClick={handleGoHome}
                  className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-semibold py-2 px-4 rounded-lg hover:bg-slate-800/60"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>{t.goHome}</span>
                </button>
              </div>
            </div>
          )}

          {/* Failed State */}
          {status === 'failed' && (
            <div className="bg-[#2D3748] rounded-2xl p-8 sm:p-12 text-center shadow-xl">
              <div className="w-24 h-24 rounded-full bg-red-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.failed}</h2>
              <p className="text-red-400 mb-8 text-sm sm:text-base">{errorMessage}</p>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.retry}
                </button>
              </div>
            </div>
          )}

          {/* Timeout State */}
          {status === 'timeout' && (
            <div className="bg-[#2D3748] rounded-2xl p-8 sm:p-12 text-center shadow-xl">
              <div className="w-24 h-24 rounded-full bg-yellow-500/20 mx-auto mb-6 flex items-center justify-center">
                <svg className="w-14 h-14 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3">{t.timeout}</h2>
              <p className="text-yellow-400 mb-8 text-sm sm:text-base">{errorMessage}</p>

              <div className="bg-blue-900/30 border border-blue-700 rounded-lg p-4 sm:p-5 mb-6 text-left">
                <p className="text-blue-200 text-sm">
                  Your payment may still be processing. You can check the status later using your application reference.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleGoHome}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold border-2 border-gray-600 text-gray-300 hover:bg-gray-700 transition-colors"
                >
                  {t.goHome}
                </button>
                <button
                  onClick={handleRetry}
                  className="flex-1 py-3 sm:py-4 rounded-lg font-semibold text-white transition-all duration-200 hover:opacity-90"
                  style={{ backgroundColor: '#CB9D2A' }}
                >
                  {t.checkStatusLater}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default VIPPaymentCallback;
