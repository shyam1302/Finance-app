import { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { Bot, Send, ShoppingCart, CheckCircle, XCircle, ExternalLink, Plus, Trash2 } from 'lucide-react';
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

    const { data: initialSavings } = useQuery({
        queryKey: ['commerceSavings'],
        queryFn: async () => {
            const res = await api.post('/commerce/chat', { message: 'savings check' });
            return res.data.savings;
        }
    });

    const savings = adjustedSavings !== null ? adjustedSavings : (initialSavings ?? null);

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

            const options = {
                key,
                amount: order.amount,
                currency: 'INR',
                name: 'Wealth OS Commerce',
                description: `${items.length} items`,
                order_id: order.id,
                handler: async (response) => {
                    const verify = await api.post('/commerce/verify', {
                        ...response,
                        items
                    });

                    if (verify.data.success) {
                        setCart([]);
                        setShowCart(false);
                        setRealProducts([]);
                        setAdjustedSavings(prev => (prev !== null ? prev - totalAmount : 0));
                        setMessages(prev => [...prev, {
                            id: `assistant-order-${prev.length + 1}`,
                            role: 'assistant',
                            content: `✅ Payment successful! ${items.length} items khareed liye!\n\nTotal: ₹${totalAmount.toLocaleString('en-IN')}\n\nSaari transactions dashboard mein add ho gayi hain! 🎉`
                        }]);
                    }
                },
                theme: { color: '#D4AF37' }
            };

            new window.Razorpay(options).open();
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
                        Real-time product search — powered by Razorpay
                    </p>
                </div>

                <div className="flex gap-3 items-center">
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
                                        : "bg-[#0a0a0a] border-[#444] mr-4"
                                )}>
                                    {m.role === 'user'
                                        ? <span className="text-xs font-bold text-[var(--color-champagne-gold)]">U</span>
                                        : <Bot className="w-5 h-5 text-[#888]" />}
                                </div>
                                <div className={cn(
                                    "px-5 py-4 rounded-xl text-[14px] font-mono leading-relaxed whitespace-pre-line",
                                    m.role === 'user'
                                        ? "bg-[#161208] border border-[rgba(212,175,55,0.3)] text-white"
                                        : "bg-[#111] border border-[#333] text-[#ddd]"
                                )}>
                                    {m.content}
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
        </div>
    );
}