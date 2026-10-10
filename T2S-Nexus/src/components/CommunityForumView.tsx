import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MessageSquare, Heart, Send, Trash2, Share2, 
  Search, Sparkles, User as UserIcon, RefreshCw
} from 'lucide-react';
import { 
  collection, query, orderBy, limit, onSnapshot, 
  addDoc, deleteDoc, doc, updateDoc, increment, serverTimestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType, isOfflineError } from '../firebase';
import { UserProfile, CommunityPost } from '../types';

interface CommunityForumViewProps {
  currentUserProfile: UserProfile | null;
  onNavigateTab?: (tab: string) => void;
}

const TOPIC_CHIPS = [
  { id: 'all', labelEn: 'All Discussions', labelHi: 'सभी चर्चाएं' },
  { id: 'reflection', labelEn: 'Daily Epiphanies', labelHi: 'दैनिक अंतर्दृष्टि' },
  { id: 'strategy', labelEn: 'Strategic Questions', labelHi: 'रणनीतिक सवाल' },
  { id: 'social', labelEn: 'Social Reality', labelHi: 'समाज की हकीकत' },
  { id: 'discipline', labelEn: 'Stoic Discipline', labelHi: 'अनुशासन व नियम' }
];

export function CommunityForumView({ currentUserProfile }: CommunityForumViewProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [activeTopicTag, setActiveTopicTag] = useState<string>('दैनिक अंतर्दृष्टि (Daily Epiphany)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likedPosts, setLikedPosts] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('t2s_liked_posts');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Subscribe to posts collection
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched: CommunityPost[] = snapshot.docs.map(docSnap => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          authorId: data.authorId || '',
          authorName: data.authorName || 'Practitioner',
          authorPhotoURL: data.authorPhotoURL || '',
          content: data.content || '',
          createdAt: data.createdAt,
          likes: typeof data.likes === 'number' ? data.likes : 0,
          likedBy: data.likedBy || [],
          topic: data.topic || ''
        };
      });

      setPosts(fetched);
      localStorage.setItem('t2s_posts_cache', JSON.stringify(fetched));
      setLoading(false);
    }, (error) => {
      if (!isOfflineError(error)) {
        handleFirestoreError(error, OperationType.LIST, 'posts');
      }
      const cached = localStorage.getItem('t2s_posts_cache');
      if (cached) {
        try {
          setPosts(JSON.parse(cached));
        } catch {
          // ignore
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim() || !currentUserProfile) return;

    setIsSubmitting(true);
    const content = newPostContent.trim();
    
    // Embed topic header in content if selected
    const taggedContent = activeTopicTag 
      ? `[${activeTopicTag}]\n${content}`
      : content;

    try {
      await addDoc(collection(db, 'posts'), {
        authorId: currentUserProfile.uid,
        authorName: (currentUserProfile.displayName || 'Anonymous Practitioner').slice(0, 100),
        authorPhotoURL: currentUserProfile.photoURL || '',
        content: taggedContent.slice(0, 5000),
        createdAt: serverTimestamp(),
        likes: 0
      });

      setNewPostContent('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleLike = async (postId: string) => {
    if (!currentUserProfile) return;
    const isLiked = likedPosts.has(postId);
    const updated = new Set(likedPosts);

    if (isLiked) {
      updated.delete(postId);
    } else {
      updated.add(postId);
    }
    setLikedPosts(updated);
    localStorage.setItem('t2s_liked_posts', JSON.stringify(Array.from(updated)));

    // Optimistic UI update
    setPosts(prev => prev.map(p => {
      if (p.id === postId) {
        return {
          ...p,
          likes: Math.max(0, p.likes + (isLiked ? -1 : 1))
        };
      }
      return p;
    }));

    try {
      const postRef = doc(db, 'posts', postId);
      await updateDoc(postRef, {
        likes: increment(isLiked ? -1 : 1)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `posts/${postId}`);
    }
  };

  const handleDeletePost = async (postId: string) => {
    if (!confirm('क्या आप निश्चित रूप से इस चर्चा पोस्ट को हटाना चाहते हैं? (Delete this post?)')) return;
    try {
      await deleteDoc(doc(db, 'posts', postId));
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `posts/${postId}`);
    }
  };

  const handleShareWhatsApp = (post: CommunityPost) => {
    const text = `💬 *Talk2Society Community Discussion*\n\n"${post.content}"\n\n👤 Posted by: ${post.authorName}\n⚡ Talk2Society Nexus — A. K. Chandradipti`;
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSearch = !searchQuery.trim() || 
        post.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.authorName.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesTopic = selectedTopic === 'all' || 
        (selectedTopic === 'reflection' && post.content.includes('दैनिक अंतर्दृष्टि')) ||
        (selectedTopic === 'strategy' && post.content.includes('रणनीतिक सवाल')) ||
        (selectedTopic === 'social' && post.content.includes('समाज की हकीकत')) ||
        (selectedTopic === 'discipline' && post.content.includes('अनुशासन'));

      return matchesSearch && matchesTopic;
    });
  }, [posts, searchQuery, selectedTopic]);

  const formatPostDate = (timestamp: any) => {
    if (!timestamp) return 'हाल ही में (Just now)';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('hi-IN', {
        day: 'numeric',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'हाल ही में (Recent)';
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-b from-[#131722] via-[#0d0f15] to-[#0a0c10] border border-amber-500/20 rounded-[28px] sm:rounded-[36px] p-6 sm:p-10 shadow-2xl">
        <div className="absolute top-0 right-0 w-80 h-80 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-mono font-bold tracking-wider uppercase">
            <MessageSquare className="w-3.5 h-3.5" /> संप्रभु चर्चा मंच (Sovereign Forum)
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl sm:text-4xl font-display font-black text-white tracking-tight uppercase">
              साधक समाज व चर्चा मंच
            </h1>
            <p className="text-zinc-400 text-xs sm:text-base max-w-2xl leading-relaxed">
              T2S अभ्यासियों का स्वतंत्र विचार मंच। अपने दैनिक अनुभवों, मनोवैज्ञानिक प्रेक्षणों और समाज की वास्तविकताओं पर निर्भीक विचार साझा करें।
            </p>
          </div>
        </div>
      </div>

      {/* Create New Post Card */}
      {currentUserProfile ? (
        <div className="bg-[#0e1017] border border-zinc-800 focus-within:border-amber-500/40 rounded-[24px] sm:rounded-[28px] p-4 sm:p-6 shadow-xl transition-all">
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                {currentUserProfile.photoURL ? (
                  <img src={currentUserProfile.photoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  <UserIcon className="w-5 h-5 text-zinc-400" />
                )}
              </div>
              <div className="flex-1">
                <span className="text-xs sm:text-sm font-bold text-white block">
                  {currentUserProfile.displayName || 'अभ्यासी (Practitioner)'}
                </span>
                <span className="text-[10px] text-zinc-400 font-mono">
                  Level {currentUserProfile.level || 1} • {currentUserProfile.streak || 1} Day Streak
                </span>
              </div>
            </div>

            {/* Topic Tag Selector */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              <span className="text-[10px] text-zinc-500 font-mono uppercase shrink-0">विषय (Topic):</span>
              {[
                'दैनिक अंतर्दृष्टि (Daily Epiphany)',
                'रणनीतिक सवाल (Strategy Question)',
                'समाज की हकीकत (Social Reality)',
                'अनुशासन व नियम (Discipline)'
              ].map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => setActiveTopicTag(tag)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                    activeTopicTag === tag
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-zinc-800/80 text-zinc-400 hover:text-white border border-zinc-700'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>

            <textarea
              value={newPostContent}
              onChange={(e) => setNewPostContent(e.target.value)}
              placeholder="आज के मॉड्यूल या जीवन से क्या सीखा? अपने स्वतंत्र विचार यहाँ लिखें... (Share your daily epiphany or observation)"
              rows={3}
              maxLength={5000}
              className="w-full bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/40 resize-none font-medium leading-relaxed"
            />

            <div className="flex items-center justify-between pt-1">
              <span className="text-[10px] text-zinc-500 font-mono">
                {newPostContent.length}/5000 अक्षर
              </span>

              <button
                type="submit"
                disabled={!newPostContent.trim() || isSubmitting}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-mono text-xs font-black uppercase tracking-wider rounded-xl transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-amber-500/20 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )}
                <span>विचार साझा करें (Publish)</span>
              </button>
            </div>
          </form>
        </div>
      ) : null}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {TOPIC_CHIPS.map(chip => (
            <button
              key={chip.id}
              onClick={() => setSelectedTopic(chip.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all whitespace-nowrap cursor-pointer ${
                selectedTopic === chip.id
                  ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                  : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
              }`}
            >
              {chip.labelHi} ({chip.labelEn})
            </button>
          ))}
        </div>

        <div className="relative sm:w-64">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="चर्चा खोजें (Search posts)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500/50"
          />
        </div>
      </div>

      {/* Posts Feed */}
      <div className="space-y-4">
        {loading ? (
          <div className="text-center py-16 space-y-3">
            <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
              चर्चा लोड हो रही है (Loading Discussions)...
            </p>
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-16 px-4 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl space-y-3">
            <MessageSquare className="w-10 h-10 text-zinc-600 mx-auto" />
            <h3 className="text-base font-bold text-white">
              {posts.length === 0 ? 'अभी कोई चर्चा प्रारंभ नहीं हुई है' : 'खोज परिणाम नहीं मिले'}
            </h3>
            <p className="text-xs text-zinc-400 max-w-sm mx-auto">
              {posts.length === 0 
                ? 'अपने विचार ऊपर बॉक्स में लिखें और समुदाय के साथ पहली चर्चा शुरू करें!' 
                : 'कृपया अन्य खोज शब्द या फ़िल्टर का चयन करें।'}
            </p>
          </div>
        ) : (
          filteredPosts.map((post) => {
            const isLiked = likedPosts.has(post.id);
            const canDelete = currentUserProfile && (
              currentUserProfile.uid === post.authorId || currentUserProfile.isAdmin
            );

            return (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#0d0f15] border border-zinc-800/80 hover:border-zinc-700/80 rounded-[24px] p-5 sm:p-6 space-y-4 transition-all shadow-md"
              >
                {/* Author Info & Actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 overflow-hidden shrink-0 flex items-center justify-center">
                      {post.authorPhotoURL ? (
                        <img src={post.authorPhotoURL} alt={post.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <UserIcon className="w-5 h-5 text-zinc-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-white">
                          {post.authorName}
                        </span>
                        {currentUserProfile && currentUserProfile.uid === post.authorId && (
                          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                            आप (You)
                          </span>
                        )}
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {formatPostDate(post.createdAt)}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {canDelete && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1.5 rounded-lg bg-zinc-800/80 hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-all cursor-pointer"
                        title="Delete Post"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Content */}
                <div className="text-xs sm:text-sm text-zinc-200 leading-relaxed font-normal whitespace-pre-line pl-1">
                  {post.content}
                </div>

                {/* Footer Controls: Like & Share */}
                <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                      isLiked
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/60'
                    }`}
                  >
                    <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-rose-400' : ''}`} />
                    <span>{post.likes}</span>
                    <span className="text-[10px] hidden sm:inline">पसंद (Likes)</span>
                  </button>

                  <button
                    onClick={() => handleShareWhatsApp(post)}
                    className="px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>WhatsApp शेयर</span>
                  </button>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
}
