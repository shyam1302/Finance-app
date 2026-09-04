import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { 
    Bot, Send, ShoppingCart, CheckCircle, XCircle, ExternalLink, 
    Plus, Trash2, AlertTriangle, RefreshCw, Copy, Check, 
    ShieldAlert, X, Info, ArrowRight, HelpCircle
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useAuth } from '../contexts/AuthContext';

export default function CommerceAgent() {
    const { user } = useAuth();
    const [messages, setMessages] = useState([{
        id: 'msg-init-1',
        role: 'assistant',
        content: `Namaste ${user?.name || 'Operator'}! 🛒 Main hoon tera AI Commerce Agent!\n\nMain internet pe real products dhundta hoon aur teri financial situation dekh ke suggest karta hoon.\n\nEk ya multiple products maango — main sab dhundh dunga!\n\nBata — kya kharidna hai aaj?`
    }]);
    const [input, setInput] = useState('');
    const [adjustedSavings, setAdjustedSavings] = useState(null);
    const [realProducts, setRealProducts] = useState([]);
    const [cart, setCart] = useState([]);
    const [showCart, setShowCart] = useState(false);
    const [paymentFailure, setPaymentFailure] = useState(null);
    const [showFailureModal, setShowFailureModal] = useState(false);
    const [copiedField, setCopiedField] = useState(null);

    const { data: initialSavings } = useQuery({
        queryKey: ['commerceSavings'],
        queryFn: async () => {
            const res = await api.post('/commerce/chat', { message: 'savings check' });
            return res.data.savings;
        }
    });

    const savings = adjustedSavings !== null ? adjustedSavings : (initialSavings ?? null);

    const copyToClipboard = (text, fieldKey) => {
        if (!text || text === 'N/A') return;
        navigator.clipboard.writeText(text);
        setCopiedField(fieldKey);
        setTimeout(() => setCopiedField(null), 2000);
    };

    const handlePaymentFailure = async (failureData, orderContext = {}) => {
        const error = failureData.error || failureData;
        const metadata = error.metadata || {};

        const errorDetails = {
            title: failureData.title || 'Payment Unsuccessful',
            code: error.code || 'PAYMENT_FAILED',
            description: error.description || error.message || 'The payment could not be completed.',
            source: error.source || 'gateway',
            step: error.step || 'payment_processing',
            reason: error.reason || 'transaction_incomplete',
            order_id: metadata.order_id || orderContext.orderId || 'N/A',
            payment_id: metadata.payment_id || 'N/A',
            amount: orderContext.amount || cartTotal,
            timestamp: new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            items: orderContext.items || cart
        };

        setPaymentFailure(errorDetails);
        setShowFailureModal(true);

        // Record failure in backend for auditing/analytics
        try {
            await api.post('/commerce/failure', {
                order_id: errorDetails.order_id !== 'N/A' ? errorDetails.order_id : null,
                payment_id: errorDetails.payment_id !== 'N/A' ? errorDetails.payment_id : null,
                amount: errorDetails.amount,
                error_code: errorDetails.code,
                error_description: errorDetails.description,
                error_source: errorDetails.source,
                error_step: errorDetails.step,
                error_reason: errorDetails.reason,
                metadata: error.metadata || {},
                items: errorDetails.items
            });
        } catch (e) {
            console.warn("Backend failure logging failed:", e);
        }

        // Add informative assistant message in chat
        setMessages(prev => [...prev, {
            id: `assistant-failure-${prev.length + 1}`,
            role: 'assistant',
            isFailure: true,
            content: `❌ **Payment Unsuccessful**\n\n**Reason:** ${errorDetails.description}\n**Error Code:** \`${errorDetails.code}\`\n**Order ID:** \`${errorDetails.order_id}\`\n\n💡 **Troubleshooting Tips:**\n• Ensure sufficient balance & active online transactions on your card/UPI\n• Check if OTP / 3D Secure timed out\n• You can click **"Retry Payment"** in the details popup to try again.`
        }]);
    };

    const chatMutation = useMutation({
        mutationFn: async (message) => (await api.post('/commerce/chat', { message })).data,
        onSuccess: (data) => {
            setMessages(prev => [...prev, {
                id: `assistant-msg-${prev.length + 1}`,
                role: 'assistant',
                content: data.data,
            }]);
            if (data.savings !== undefined) setAdjustedSavings(data.savings);
            if (data.products && data.products.length > 0) {
                setRealProducts(data.products);
            }
        }
    });

    const orderMutation = useMutation({
        mutationFn: async (items) =>
            (await api.post('/commerce/order', { items })).data,
        onSuccess: (data) => {
            const { order, items, totalAmount, key } = data;

            if (!window.Razorpay) {
                handlePaymentFailure({
                    error: {
                        code: 'SDK_NOT_LOADED',
                        description: 'Razorpay SDK is not loaded. Please check your internet connection.',
                        reason: 'sdk_missing',
                        source: 'frontend',
                        step: 'sdk_initialization'
                    }
                }, { orderId: order?.id, amount: totalAmount, items });
                return;
            }

            const options = {
                key,
                amount: order.amount,
                currency: 'INR',
                name: 'Wealth OS Commerce',
                description: `${items.length} item(s) purchase`,
                order_id: order.id,
                modal: {
                    ondismiss: function () {
                        console.log("Razorpay checkout modal closed by user");
                    }
                },
                handler: async (response) => {
                    try {
                        const verify = await api.post('/commerce/verify', {
                            ...response,
                            items
                        });

                        if (verify.data.success) {
                            setCart([]);
                            setShowCart(false);
                            setRealProducts([]);
                            setPaymentFailure(null);
                            setShowFailureModal(false);
                            setAdjustedSavings(prev => (prev !== null ? prev - totalAmount : 0));
                            setMessages(prev => [...prev, {
                                id: `assistant-order-${prev.length + 1}`,
                                role: 'assistant',
                                content: `✅ Payment successful! ${items.length} items khareed liye!\n\nTotal: ₹${totalAmount.toLocaleString('en-IN')}\n\nSaari transactions dashboard mein add ho gayi hain! 🎉`
                            }]);
                        } else {
                            handlePaymentFailure({
                                error: {
                                    code: 'VERIFICATION_FAILED',
                                    description: verify.data?.error || 'Payment signature verification failed.',
                                    reason: 'signature_mismatch',
                                    source: 'server',
                                    step: 'signature_verification',
                                    metadata: {
                                        order_id: response.razorpay_order_id,
                                        payment_id: response.razorpay_payment_id
                                    }
                                }
                            }, { orderId: order.id, amount: totalAmount, items });
                        }
                    } catch (verifyErr) {
                        handlePaymentFailure({
                            error: {
                                code: 'SERVER_VERIFICATION_ERROR',
                                description: verifyErr.response?.data?.error || verifyErr.message || 'Could not verify payment with server.',
                                reason: 'server_error',
                                source: 'server',
                                step: 'payment_verification',
                                metadata: {
                                    order_id: response.razorpay_order_id,
                                    payment_id: response.razorpay_payment_id
                                }
                            }
                        }, { orderId: order.id, amount: totalAmount, items });
                    }
                },
                theme: { color: '#D4AF37' }
            };

            const rzp = new window.Razorpay(options);

            rzp.on('payment.failed', function (response) {
                console.error("Razorpay payment.failed event:", response);
                handlePaymentFailure(response, {
                    orderId: order.id,
                    amount: totalAmount,
                    items
                });
            });

            rzp.open();
        },
        onError: (err) => {
            handlePaymentFailure({
                error: {
                    code: 'ORDER_CREATION_FAILED',
                    description: err.response?.data?.error || err.message || 'Could not create order with payment gateway.',
                    reason: 'order_creation_failed',
                    source: 'server',
                    step: 'order_initialization'
                }
            }, { amount: cartTotal, items: cart });
        }
    });

    const handleSend = (e) => {
        e.preventDefault();
        if (!input.trim() || chatMutation.isPending) return;
        const userMsg = input.trim();
        setMessages(prev => [...prev, { id: `user-msg-${prev.length + 1}`, role: 'user', content: userMsg }]);
        setInput('');
        setRealProducts([]);
        chatMutation.mutate(userMsg);
    };

    const addToCart = (product) => {
        const price = parseFloat(product.price?.replace(/[^0-9.]/g, '')) || 0;
        setCart(prev => [
            ...prev,
            {
                id: `cart-item-${product.title || 'item'}-${prev.length + 1}`,
                name: product.title,
                price,
                source: product.source,
                image: product.imageUrl,
                link: product.link
            }
        ]);
        setShowCart(true);
    };

    const removeFromCart = (id) => {
        setCart(prev => prev.filter(item => item.id !== id));
    };

    const cartTotal = cart.reduce((sum, item) => sum + item.price, 0);

    const handleCheckout = () => {
        if (cart.length === 0) return;
        orderMutation.mutate(cart.map(item => ({
            name: item.name,
            price: item.price,
            category: 'shopping'
        })));
    };

    return (
        <div className="absolute inset-x-0 inset-y-0 flex flex-col gap-4 animate-fade-in p-4 md:p-6 max-w-7xl mx-auto w-full">

            {/* Header */}
            <div className="flex justify-between items-center shrink-0">
                <div>
                    <h1 className="text-[28px] font-bebas tracking-[4px] text-engraved-gold flex items-center">
                        AI COMMERCE AGENT
                        <ShoppingCart className="w-6 h-6 ml-3 text-[var(--color-champagne-gold)] opacity-80" />
                    </h1>
                    <p className="text-[#888] font-mono text-[10px] tracking-[0.2em] uppercase mt-1">
                        Real-time product search & secure checkout — powered by Razorpay
                    </p>
                </div>

                <div className="flex gap-3 items-center">
                    {/* Failure details trigger button if failure exists */}
                    {paymentFailure && (
                        <button
                            onClick={() => setShowFailureModal(true)}
                            className="flex items-center gap-2 bg-[#2a0d0d] border border-red-500/50 text-red-400 px-3 py-2 rounded-xl text-xs font-mono font-bold hover:bg-red-950/60 transition-all animate-pulse"
                            title="View last payment failure details"
                        >
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="hidden sm:inline">LAST FAILURE INFO</span>
                        </button>
                    )}

                    {/* Cart Button */}
                    <button
                        onClick={() => setShowCart(!showCart)}
                        className="relative bg-pvd-plate px-4 py-3 rounded-xl plate-border shadow-plate hover:border-[#D4AF37] transition-all"
                    >
                        <ShoppingCart className="w-5 h-5 text-[var(--color-champagne-gold)]" />
                        {cart.length > 0 && (
                            <span className="absolute -top-2 -right-2 bg-[#00C853] text-black text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center">
                                {cart.length}
                            </span>
                        )}
                    </button>

                    {/* Savings Badge */}
                    <div className="bg-pvd-plate px-5 py-3 rounded-xl plate-border shadow-plate">
                        <p className="text-[10px] font-mono text-[#888] uppercase tracking-widest">Available Savings</p>
                        <p className="text-[18px] font-bebas text-[#00C853] tracking-widest">
                            {savings !== null ? `₹${Number(savings).toLocaleString('en-IN')}` : 'Loading...'}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex-1 flex gap-4 overflow-hidden">

                {/* Chat Area */}
                <div className="flex-1 bg-cotes-de-geneve plate-border shadow-plate rounded-2xl flex flex-col overflow-hidden">
                    <div className="flex-1 p-6 overflow-y-auto space-y-6 bg-[#050505]/80 scrollbar-thin scrollbar-thumb-[#333]">
                        {messages.map((m, i) => (
                            <div key={m.id || i} className={cn(
                                "flex items-start max-w-[85%]",
                                m.role === 'user' ? "ml-auto flex-row-reverse" : ""
                            )}>
                                <div className={cn(
                                    "w-10 h-10 rounded-full flex items-center justify-center shrink-0 border",
                                    m.role === 'user'
                                        ? "bg-[#111] border-[var(--color-champagne-gold)] ml-4"
                                        : m.isFailure
                                            ? "bg-[#200a0a] border-red-500/50 mr-4"
                                            : "bg-[#0a0a0a] border-[#444] mr-4"
                                )}>
                                    {m.role === 'user' ? (
                                        <span className="text-xs font-bold text-[var(--color-champagne-gold)]">U</span>
                                    ) : m.isFailure ? (
                                        <AlertTriangle className="w-5 h-5 text-red-400" />
                                    ) : (
                                        <Bot className="w-5 h-5 text-[#888]" />
                                    )}
                                </div>
                                <div className={cn(
                                    "px-5 py-4 rounded-xl text-[14px] font-mono leading-relaxed whitespace-pre-line",
                                    m.role === 'user'
                                        ? "bg-[#161208] border border-[rgba(212,175,55,0.3)] text-white"
                                        : m.isFailure
                                            ? "bg-[#1a0c0c] border border-red-500/30 text-red-200"
                                            : "bg-[#111] border border-[#333] text-[#ddd]"
                                )}>
                                    {m.content}
                                    {m.isFailure && (
                                        <div className="mt-4 pt-3 border-t border-red-500/20 flex flex-wrap gap-2">
                                            <button
                                                onClick={() => setShowFailureModal(true)}
                                                className="px-3 py-1.5 bg-red-950/60 hover:bg-red-900/60 border border-red-500/40 rounded text-[11px] text-red-300 font-bold flex items-center gap-1.5 transition-colors"
                                            >
                                                <Info className="w-3.5 h-3.5" /> View Diagnostic Details
                                            </button>
                                            {cart.length > 0 && (
                                                <button
                                                    onClick={handleCheckout}
                                                    disabled={orderMutation.isPending}
                                                    className="px-3 py-1.5 bg-[#D4AF37] hover:bg-[#F5D06B] text-black font-bold rounded text-[11px] flex items-center gap-1.5 transition-colors"
                                                >
                                                    <RefreshCw className={cn("w-3.5 h-3.5", orderMutation.isPending && "animate-spin")} />
                                                    Retry Checkout
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}

                        {chatMutation.isPending && (
                            <div className="flex items-center max-w-[85%]">
                                <div className="w-10 h-10 rounded-full flex items-center justify-center bg-[#0a0a0a] border border-[#444] mr-4">
                                    <Bot className="w-5 h-5 animate-pulse text-[var(--color-champagne-gold)]" />
                                </div>
                                <div className="px-5 py-4 bg-[#111] border border-[#333] rounded-xl flex items-center space-x-2">
                                    <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse"></div>
                                    <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse" style={{ animationDelay: '200ms' }}></div>
                                    <div className="w-2 h-2 bg-[var(--color-champagne-gold)] rounded-full animate-pulse" style={{ animationDelay: '400ms' }}></div>
                                </div>
                            </div>
                        )}
                    </div>

                    {messages.length < 3 && (
                        <div className="bg-[#0a0a0a] px-6 py-3 flex gap-3 overflow-x-auto border-t border-[#333]">
                            {[
                                'iPhone 15 chahiye',
                                'Laptop + bag + mouse chahiye',
                                'Budget setup under 50000'
                            ].map(txt => (
                                <button key={txt} onClick={() => setInput(txt)}
                                    className="text-[10px] font-mono font-bold tracking-widest text-[#aaa] border border-[#444] px-4 py-2 rounded uppercase whitespace-nowrap hover:text-[var(--color-champagne-gold)] hover:border-[var(--color-champagne-gold)] transition-colors">
                                    {txt}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="p-4 bg-[#0d0d0d] border-t border-[#333]">
                        <form onSubmit={handleSend} className="flex gap-3">
                            <input type="text" value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Kya kharidna hai aaj? (ek ya multiple!)"
                                className="flex-1 bg-[#111] border border-[#333] text-white text-[14px] font-mono rounded focus:border-[var(--color-champagne-gold)] px-4 py-3 outline-none transition-all placeholder-[#555]" />
                            <button type="submit"
                                disabled={chatMutation.isPending || !input.trim()}
                                className="px-6 py-3 bg-[#0a0a0a] text-engraved-gold border border-[rgba(212,175,55,0.5)] rounded hover:bg-[#1a1608] transition-all disabled:opacity-40 flex items-center font-mono font-bold text-[11px] tracking-widest">
                                <Send className="w-4 h-4 mr-2" /> SEND
                            </button>
                        </form>
                    </div>
                </div>

                {/* Right Panel */}
                <div className="w-80 flex flex-col gap-3 overflow-hidden">

                    {/* Cart Panel */}
                    {showCart && cart.length > 0 && (
                        <div className="bg-[#0a0a0a] border border-[#D4AF37]/30 rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-[#333] flex justify-between items-center">
                                <p className="text-[var(--color-champagne-gold)] font-mono font-bold text-sm">
                                    🛒 CART ({cart.length} items)
                                </p>
                                <button onClick={() => setShowCart(false)}>
                                    <XCircle className="w-4 h-4 text-[#666]" />
                                </button>
                            </div>
                            <div className="p-3 space-y-2 max-h-48 overflow-y-auto">
                                {cart.map(item => (
                                    <div key={item.id} className="flex items-center justify-between bg-[#111] rounded-lg p-2">
                                        <div className="flex-1">
                                            <p className="text-white font-mono text-[10px] leading-tight">
                                                {item.name?.substring(0, 30)}...
                                            </p>
                                            <p className="text-[#00C853] font-bebas text-sm">
                                                ₹{item.price.toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <button onClick={() => removeFromCart(item.id)}
                                            className="text-[#ff4444] hover:text-red-300 ml-2">
                                            <Trash2 className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            <div className="p-3 border-t border-[#333]">
                                <div className="flex justify-between mb-3">
                                    <span className="text-[#888] font-mono text-xs">TOTAL:</span>
                                    <span className="text-[#00C853] font-bebas text-lg">
                                        ₹{cartTotal.toLocaleString('en-IN')}
                                    </span>
                                </div>
                                <button
                                    onClick={handleCheckout}
                                    disabled={orderMutation.isPending}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-[#00C853] text-black font-mono font-bold text-sm rounded-xl hover:bg-[#00E676] transition-all">
                                    <CheckCircle className="w-4 h-4" />
                                    {orderMutation.isPending ? 'PROCESSING...' : 'CHECKOUT VIA RAZORPAY'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Products Panel */}
                    {realProducts.length > 0 && (
                        <div className="flex-1 bg-[#0a0a0a] border border-[#333] rounded-2xl flex flex-col overflow-hidden">
                            <div className="p-3 border-b border-[#333]">
                                <p className="text-[var(--color-champagne-gold)] font-mono font-bold text-sm tracking-widest">
                                    🔍 LIVE SEARCH RESULTS
                                </p>
                            </div>
                            <div className="flex-1 overflow-y-auto p-3 space-y-3">
                                {realProducts.map((product, i) => (
                                    <div key={i} className="bg-[#111] border border-[#333] rounded-xl p-3 hover:border-[#D4AF37]/50 transition-all">
                                        {product.imageUrl && (
                                            <img src={product.imageUrl} alt={product.title}
                                                className="w-full h-28 object-contain rounded-lg mb-2 bg-white p-1" />
                                        )}
                                        <p className="text-white font-mono text-xs font-bold leading-tight">
                                            {product.title?.substring(0, 50)}...
                                        </p>
                                        <p className="text-[#00C853] font-bebas text-lg mt-1">
                                            {product.price}
                                        </p>
                                        <p className="text-[#888] font-mono text-[10px] mt-1">
                                            📦 {product.source}
                                        </p>
                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => addToCart(product)}
                                                className="flex-1 flex items-center justify-center gap-1 px-3 py-2 bg-[#D4AF37] text-black font-mono font-bold text-[10px] rounded-lg hover:bg-[#F5D06B] transition-all">
                                                <Plus className="w-3 h-3" />
                                                ADD TO CART
                                            </button>
                                            {product.link && (
                                                <a href={product.link} target="_blank" rel="noopener noreferrer"
                                                    className="flex items-center justify-center px-3 py-2 bg-[#111] text-[#D4AF37] border border-[#D4AF37]/50 rounded-lg hover:bg-[#1a1608] transition-all">
                                                    <ExternalLink className="w-3 h-3" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* PAYMENT FAILURE DETAILS MODAL */}
            {showFailureModal && paymentFailure && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="bg-[#0e0909] border border-red-500/40 rounded-2xl w-full max-w-xl shadow-[0_0_50px_rgba(239,68,68,0.2)] overflow-hidden flex flex-col">
                        
                        {/* Modal Header */}
                        <div className="px-6 py-4 border-b border-red-950 flex justify-between items-center bg-gradient-to-r from-red-950/40 to-transparent">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-red-950/80 border border-red-500/50 flex items-center justify-center text-red-400">
                                    <ShieldAlert className="w-5 h-5" />
                                </div>
                                <div>
                                    <h2 className="text-lg font-bebas tracking-[2px] text-red-400">PAYMENT FAILURE DETAILS</h2>
                                    <p className="text-[10px] font-mono text-[#888]">Transaction Diagnostic Report • {paymentFailure.timestamp}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowFailureModal(false)}
                                className="text-[#888] hover:text-white p-1 rounded-lg hover:bg-[#222] transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-red-950">
                            
                            {/* Primary Failure Reason Box */}
                            <div className="bg-red-950/30 border border-red-500/30 rounded-xl p-4">
                                <p className="text-[10px] font-mono text-red-400 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                    <AlertTriangle className="w-3.5 h-3.5" /> Primary Error Description
                                </p>
                                <p className="text-white font-mono text-[14px] leading-relaxed font-semibold">
                                    {paymentFailure.description}
                                </p>
                            </div>

                            {/* Technical Diagnostic Grid */}
                            <div>
                                <p className="text-[11px] font-mono text-[#888] uppercase tracking-widest mb-3">Diagnostic Breakdown</p>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    
                                    {/* Error Code */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3">
                                        <p className="text-[10px] font-mono text-[#888] uppercase">Error Code</p>
                                        <p className="text-red-400 font-mono text-xs font-bold mt-1 break-all">
                                            {paymentFailure.code}
                                        </p>
                                    </div>

                                    {/* Failure Reason */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3">
                                        <p className="text-[10px] font-mono text-[#888] uppercase">Failure Reason</p>
                                        <p className="text-[#ddd] font-mono text-xs font-medium mt-1 capitalize">
                                            {paymentFailure.reason?.replace(/_/g, ' ')}
                                        </p>
                                    </div>

                                    {/* Failure Source */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3">
                                        <p className="text-[10px] font-mono text-[#888] uppercase">Declining Source</p>
                                        <p className="text-[#D4AF37] font-mono text-xs font-medium mt-1 uppercase">
                                            {paymentFailure.source}
                                        </p>
                                    </div>

                                    {/* Payment Step */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3">
                                        <p className="text-[10px] font-mono text-[#888] uppercase">Failed At Step</p>
                                        <p className="text-[#bbb] font-mono text-xs font-medium mt-1 capitalize">
                                            {paymentFailure.step?.replace(/_/g, ' ')}
                                        </p>
                                    </div>

                                    {/* Order ID */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3 flex justify-between items-center sm:col-span-2">
                                        <div className="overflow-hidden">
                                            <p className="text-[10px] font-mono text-[#888] uppercase">Gateway Order ID</p>
                                            <p className="text-white font-mono text-xs mt-1 truncate">
                                                {paymentFailure.order_id}
                                            </p>
                                        </div>
                                        {paymentFailure.order_id !== 'N/A' && (
                                            <button
                                                onClick={() => copyToClipboard(paymentFailure.order_id, 'order_id')}
                                                className="ml-2 px-2.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#aaa] hover:text-white rounded text-xs font-mono flex items-center gap-1 transition-colors shrink-0"
                                            >
                                                {copiedField === 'order_id' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedField === 'order_id' ? 'Copied' : 'Copy'}
                                            </button>
                                        )}
                                    </div>

                                    {/* Payment ID (if generated) */}
                                    {paymentFailure.payment_id !== 'N/A' && (
                                        <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3 flex justify-between items-center sm:col-span-2">
                                            <div className="overflow-hidden">
                                                <p className="text-[10px] font-mono text-[#888] uppercase">Gateway Payment ID</p>
                                                <p className="text-white font-mono text-xs mt-1 truncate">
                                                    {paymentFailure.payment_id}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => copyToClipboard(paymentFailure.payment_id, 'payment_id')}
                                                className="ml-2 px-2.5 py-1.5 bg-[#222] hover:bg-[#333] text-[#aaa] hover:text-white rounded text-xs font-mono flex items-center gap-1 transition-colors shrink-0"
                                            >
                                                {copiedField === 'payment_id' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                                                {copiedField === 'payment_id' ? 'Copied' : 'Copy'}
                                            </button>
                                        </div>
                                    )}

                                    {/* Attempted Amount */}
                                    <div className="bg-[#140e0e] border border-[#2a1a1a] rounded-xl p-3 sm:col-span-2 flex justify-between items-center">
                                        <div>
                                            <p className="text-[10px] font-mono text-[#888] uppercase">Attempted Cart Value</p>
                                            <p className="text-[#00C853] font-bebas text-xl mt-0.5">
                                                ₹{Number(paymentFailure.amount || 0).toLocaleString('en-IN')}
                                            </p>
                                        </div>
                                        <span className="text-[11px] font-mono text-[#888]">
                                            {paymentFailure.items?.length || cart.length} item(s) in cart
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Resolution & Troubleshooting Advice */}
                            <div className="bg-[#111] border border-[#333] rounded-xl p-4">
                                <p className="text-[11px] font-mono text-[var(--color-champagne-gold)] uppercase tracking-widest mb-2 flex items-center gap-1.5 font-bold">
                                    <HelpCircle className="w-3.5 h-3.5" /> What should you do next?
                                </p>
                                <ul className="text-xs font-mono text-[#aaa] space-y-1.5 list-disc list-inside">
                                    <li>Confirm your bank account or credit card has sufficient available balance.</li>
                                    <li>Check if domestic/international online transaction limits are enabled on your card.</li>
                                    <li>If UPI failed, ensure your UPI PIN was entered correctly and banking servers are active.</li>
                                    <li>You can safely retry the payment with an alternate method (UPI / NetBanking / Debit Card).</li>
                                </ul>
                            </div>
                        </div>

                        {/* Modal Footer Actions */}
                        <div className="p-4 bg-[#0a0606] border-t border-red-950/60 flex flex-wrap justify-end gap-3">
                            <button
                                onClick={() => setShowFailureModal(false)}
                                className="px-4 py-2.5 bg-[#1a1a1a] hover:bg-[#252525] text-[#ccc] hover:text-white font-mono text-xs rounded-xl transition-all"
                            >
                                Close Diagnostics
                            </button>
                            {cart.length > 0 && (
                                <button
                                    onClick={() => {
                                        setShowFailureModal(false);
                                        handleCheckout();
                                    }}
                                    disabled={orderMutation.isPending}
                                    className="px-5 py-2.5 bg-[#D4AF37] hover:bg-[#F5D06B] text-black font-mono font-bold text-xs rounded-xl flex items-center gap-2 transition-all shadow-lg hover:shadow-[#D4AF37]/20"
                                >
                                    <RefreshCw className={cn("w-4 h-4", orderMutation.isPending && "animate-spin")} />
                                    {orderMutation.isPending ? 'Processing...' : 'Retry Payment Now'}
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}