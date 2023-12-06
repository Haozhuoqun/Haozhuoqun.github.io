---
layout: default
title: All posts
permalink: /all-posts/
---
啊这就是全部文章惹。

{% raw %}
<h1>All Posts</h1>

<ul>
  {% for post in site.posts %}
    <li>
      <h2><a href="{{ post.url }}">{{ post.title }}</a></h2>
      <p>{{ post.date | date: "%B %d, %Y" }}</p>
      <!-- You can add more details or excerpts from the posts here -->
    </li>
  {% endfor %}
</ul>
{% endraw %}