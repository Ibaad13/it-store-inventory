# IT Store Inventory – searchable room map

A static website (plain HTML, CSS and JavaScript – no build step, no server).

* **Map** – the room layout; click any cabinet to see everything inside it.
* **Search** – type a name, asset tag or keyword; the matching cabinet(s) light up on the map.
* **Info** – the summary page (date, managed by, rules, shelf overview).

## Design
Corporate, minimal "Slate" theme: Inter typeface, a single blue accent, hairline borders, a key-figures strip, SVG icons throughout, and smooth motion (room outline draw-in, staggered cabinets, sliding tab thumb, count-up figures, animated modal and table rows). Light/dark toggle in the header; animations are disabled automatically for users who prefer reduced motion. Colours are CSS variables at the top of `css/style.css` (`--acc` is the accent).

## Files

```
index.html          the page
css/style.css       look and feel ("Slate" corporate theme, light + dark)
js/app.js           map, search and tabs  (cabinet positions are at the top of this file)
data/inventory.js   ALL the inventory data – edit this file to update the list
tools/build_data.py optional: rebuild data/inventory.js from the Word files
.nojekyll           tells GitHub Pages to serve the files as-is
```

To try it on your own computer, just double-click `index.html`.

---

# Hosting it free on GitHub Pages (step by step)

You need a free GitHub account. Everything below can be done in the browser – no software to install.

## 1. Create a GitHub account
1. Go to <https://github.com> and click **Sign up**.
2. Verify your email address.

## 2. Create a new repository
1. Click the **+** at the top right → **New repository**.
2. **Repository name:** `it-store-inventory` (this becomes part of your link).
3. Choose **Public**. (GitHub Pages is free for public repositories. If you need it private, see the note at the bottom.)
4. Leave all the "Add a README / .gitignore / license" boxes **unticked**.
5. Click **Create repository**.

## 3. Upload the website files
1. Unzip `it-store-inventory-website.zip` on your computer. You will get a folder containing `index.html`, `css`, `js`, `data`, etc.
2. On the empty repository page, click **uploading an existing file**.
3. Open the unzipped folder and select **everything inside it** (not the folder itself) – `index.html`, `README.md`, `.nojekyll`, and the `css`, `js`, `data`, `tools` folders – and **drag them into the browser window**.
   * Dragging folders keeps their structure. `index.html` must end up at the top level of the repository, not inside another folder.
   * If your computer hides files starting with a dot, `.nojekyll` may not be visible; it is optional, the site works without it.
4. Wait for the upload to finish, then click the green **Commit changes** button.

## 4. Turn on GitHub Pages
1. In your repository, click **Settings** (top row of tabs).
2. In the left menu click **Pages**.
3. Under **Build and deployment → Source**, choose **Deploy from a branch**.
4. Under **Branch**, choose **main** and the folder **/ (root)**, then click **Save**.

## 5. Open your website
1. Wait 1–3 minutes, then refresh the **Pages** settings page.
2. A box appears: *"Your site is live at …"*
3. Your link will look like:

   **`https://YOUR-USERNAME.github.io/it-store-inventory/`**

4. Share that link with everyone. It works on phones, tablets and computers, and needs no login.

> Tip: print a QR code of the link and stick it on the store-room door.

---

# Keeping the inventory up to date

## Option A – edit directly on GitHub (easiest)
1. In your repository open **data → inventory.js**.
2. Click the pencil icon (**Edit this file**).
3. Find the cabinet (for example `"HC-06": [`) and add, change or remove an item. Each item looks like this:

   ```js
   {
     "n": "8",
     "name": "Item name exactly as written on the asset",
     "qty": "2",
     "tags": ["F-12345", "F-12346"],
     "condition": "New",
     "remarks": ""
   }
   ```
   * Keep the commas between items, and between `{ … }` blocks, exactly as in the other entries.
   * `tags` is a list; leave it as `[]` if there are none.
4. Click **Commit changes**. The live site updates in about a minute.

**LC-01** is currently empty because no list for it was in the zip. Add its items inside `"LC-01": [ ]` the same way.

## Option B – regenerate from the Word files
If you prefer keeping the lists in Word:

```
pip install python-docx
python3 tools/build_data.py  path/to/folder_with_docx_files  data/inventory.js
```
Then upload the new `data/inventory.js` to GitHub (open the **data** folder in the repository → **Add file → Upload files**).

## Moving a cabinet on the map
Open `js/app.js`; the `CABINETS` list at the top gives each cabinet's position (`x`, `y`). Change the numbers and commit.

---

## Troubleshooting
| Problem | Fix |
|---|---|
| Link shows "404" | Wait a few minutes; check Settings → Pages shows the site as live; make sure `index.html` is at the top level of the repository. |
| Page appears but is blank / unstyled | The `css`, `js` or `data` folder was not uploaded. Upload it again. |
| My change does not show | Hard-refresh the page (Ctrl+F5, or Cmd+Shift+R). |
| Search finds nothing for an asset I know exists | Items are listed under the name written in the cabinet list (e.g. "Cable Box"); try a shorter or more general word, or search by tag. |

**Private repository?** GitHub Pages on private repositories needs a paid GitHub plan. The free option is a public repository – note that anyone with the link can then see the inventory, so don't put anything confidential in it.
