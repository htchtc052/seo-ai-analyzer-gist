You are analysing whether an article is relevant to a target search query.

Target query: {{query}}
Target audience: {{audience}}
Content purpose: {{purpose}}
Website niche: {{niche}}

Article: "{{articleTitle}}"
Fragments with cosine similarity scores against the query (higher is more relevant):
{{fragments}}

Competitor articles on the same topic:
{{competitors}}

Return two lists.
missingEntities: short topic names, not questions, for topics covered by the competitor articles above that this article does not cover. Treat a topic as covered when the article discusses the same meaning in different words. If there are no such topics, return an empty array.
recommendations: concrete, actionable improvements to this article's relevance to the target query, including general suggestions that are not tied to competitors.
Write both lists in the language of the article.
