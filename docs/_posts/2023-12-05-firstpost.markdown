---
layout: post
title:  "Getting start on jekyll"
date:   2023-12-05 22:39:25 -0600
---

It turned out that the simple
{% highlight bash %}
bundle exec jekyll serve
{% endhighlight %}
can indeed solve the dependancy error to build ruby, but it need another magic line:

{% highlight bash %}
bundle add webrick
{% endhighlight %}

interesting.