/**
 * Removes duplicate employee objects based on their URL.
 * 
 * @param {Array<Object>} results - Array of employee objects
 * @returns {Array<Object>} - Deduplicated array
 */
function dedupe(results) {
    if (!Array.isArray(results)) return [];
    
    const seenUrls = new Set();
    const deduped = [];
    
    for (const item of results) {
        if (!item) continue;
        
        let urlKey = null;
        if (item.url) {
            // Normalize URL slightly
            urlKey = item.url.trim().toLowerCase().replace(/\/$/, '');
        } else if (item.name) {
            // Fallback to name if url is missing
            urlKey = `name:${item.name.trim().toLowerCase()}`;
        }
        
        if (urlKey) {
            if (!seenUrls.has(urlKey)) {
                seenUrls.add(urlKey);
                deduped.push(item);
            }
        } else {
            // If no url or name, keep it
            deduped.push(item);
        }
    }
    
    return deduped;
}

module.exports = { dedupe };
