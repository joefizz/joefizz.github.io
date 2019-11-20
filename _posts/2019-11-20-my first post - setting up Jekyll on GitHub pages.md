---
author: joseph
title: setting up GitHub page with Jekyll
---
This is the first post on my site.  It's intended purpose is to get things rolling and as a place to store all the different bits of code that can be placed in posts to make them look fancy.

This site is built with Jekyll and hosted on GitHub pages.  I first saw someone using GitHub pages for hosting a blog and thought it was a cool idea.  It's taken me many more hours than first expected to get \this up and running but progress has been made!  For anyone else thinking that this might be a good idea then i recommend doing things in this order:

<!-- This is a numbered list-->
1.  Start with Jekyll locally.  Wait until you understand whats going on and have your initial content sorted before setting up GitHub. Docs for installing Jekyll are available at <https://jekyllrb.com/docs/installation/>. Followed by a basic guide for getting started at <https://jekyllrb.com/docs/step-by-step/01-setup/>.  I highly recommend following these two guides to get things set up.
 
    Once you get to this point there will be a lot of running Jekyll from the terminal.  This will be with `jekyll serve` or more likely `bundle exec jekyll serve`.  On top of these commands you can also add some flags to show more info, `--trace` shows some trace logs and `--verbose` shows a whole lot more bits and pieces.  You can also add `--safe` to see if it will all build well together (GitHub pages will build with `--safe` so it's always good to check locally as this can prevent things building)

    Once you have Jekyll running in terminal you can just leave it unless you need to update the bundle.  It will automatically rebuils the local site everytime you make a change to your source files.  Very nice for testing.
    
1.  Once you have things setup with the above steps get the hang of the Jekyll mark up and look at available themes if you don't want to plod through the process of doing the styling manually.  If you want to make changes to any theme just take the files from the theme repository on GitHub and save them to the appropriate location manually then make your chagnes there, these local files will overwrite the theme files.

2.  Now that you have figured it all out get some content together.  Start with anything.  That's what i'm doing now.

3.  Now you can set up your GitHub repo. This bit is easy.  Make a repository ensuring that the site name matches the repositoy name (in this case it is joefizz.github.io).  You can customise it with your own domain.  Guide for setting up, etc. is available here: https://jekyllrb.com/docs/step-by-step/01-setup/.  This site goes in to a lot of detail with Jekyll and stuff but we've already done that so just follow the first step for setting up the repo.

4.  Ready to push your files?  Before doing so I recommend excluding some folders.  When you do a local `jekyll serve` Jekyll will build your site in the `_site` folder.  Every time you change your source files Jekyll will update the files in here which can be a pain as git will then think you've got additional changes, even if you've just re-served and not actually made any changed.  You can create a `.gitignore` file to prevent this happening and place it in the root of your local repo folder. 

    Contents of .gitignore (i;m on a mac hence the presence of the `.DS_Store` file):

    ```
    _site
    .DS_Store
    .jekyll
    .bundle
    .sass-cache
    Gemfile.lock
    node_modules
    package.json

    # Jekyll stuff
    /_site/
    _site/
    .sass-cache/
    .jekyll-metadata
    ```

5.  Now push your files and you're away laughing!


