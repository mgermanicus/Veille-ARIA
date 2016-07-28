'use strict';

var LEFT=37,
    UP=38,
    RIGHT=39,
    DOWN=40,
    SPACE=32,
    TAB=9,
    ESC=27,
    ENTER=13;

$(document).ready(function() {
    var nav = new MenuBar('nav');
});

/*********************/
/*    MENU WIDGET    */
/*********************/
class MenuBar {
    constructor(id) {
        this.$id = $('#' + id);

        this.$rootItems = this.$id.children();

        this.$parents = this.$id.find('.menu-parent');
        this.$items = this.$id.find('.menu-item');
        this.$allItems = this.$parents.add(this.$items);

        this.$activeItem = null;

        this.bChildOpen = false; // true if child menu is opened

        this.bindHandlers();
    }

    bindHandlers() {
        var self = this;

        // ITEMS
        this.$items.mouseenter(function(e) {
            $(this).addClass('menu-hover');
            return true;
        });
        this.$items.mouseout(function(e) {
            $(this).removeClass('menu-hover');
            return true;
        });

        // PARENTS
        this.$parents.mouseenter(function(e) {
            return self.handleMouseEnter($(this), e);
        });
        this.$parents.mouseleave(function (e) {
            return self.handleMouseLeave($(this), e);
        });

        // ALL
        this.$allItems.click(function (e) {
            return self.handleClick($(this), e);
        });
        this.$allItems.keydown(function (e) {
            return self.handleKeyDown($(this), e);
        });
        this.$allItems.keypress(function (e) {
            return self.handleKeyPress($(this), e);
        });
        this.$allItems.focus(function (e) {
            return self.handleFocus($(this), e);
        });
        this.$allItems.blur(function (e) {
            return self.handleBlur($(this), e);
        });

        // DOCUMENT
        $(document).click(function (e) {
            return self.handleDocumentClick(e);
        });
    }


    handleMouseEnter($item, e) {
        $item.addClass('menu-hover');

        if ($item.attr('aria-haspopup') == 'true') {
            $item.children('ul').attr('aria-hidden', 'false');
        }

        return true;
    }

    handleMouseLeave($menu, e) {
        var $active = $menu.find('.menu-focus');
        $menu.removeClass('menu-hover');

        if ($active.length > 0) {
            this.bChildOpen = false; // child menu is closed
            $active.removeClass('menu-focus');

            this.$activeItem = $menu; // Store the active item

            $menu.focus(); // move focus to root item in order to hide items
        }

        // hide the child menu
        $menu.children('ul').attr('aria-hidden', 'true');
        return true;
    }

    handleClick($item, e) {
        var $parentMenu = $item.parent();

        if ($parentMenu.is('.root-level')) {
            $item.children('ul').first().attr('aria-hidden', 'false'); // open child menu if closed
        }
        else {
            // child menu closed
            this.processMenuChoice($item);
            this.$allItems.removeClass('menu-hover menu-focus');
            this.$id.find('ul').not('.root-level').attr('aria-hidden', 'true');
        }

        e.stopPropagation();
        return false;
    }

    handleFocus($item, e) {
        if (this.$activeItem == null) {
            this.$activeItem = $item;
        }
        else if ($item[0] != this.$activeItem[0]) {
            return true;
        }

        // get the set of objects for all the parent items of the active item
        var $parentItems = this.$activeItem.parentsUntil('div').filter('li');

        this.$allItems.removeClass('menu-focus');
        this.$activeItem.addClass('menu-focus');
        $parentItems.addClass('menu-focus');
        return true;
    }

    handleBlur($item, e) {
        $item.removeClass('menu-focus');
        return true;
    }

    handleKeyDown($item, e) {
        if (e.altKey || e.ctrlKey) {
            return true;
        }

        switch (e.keyCode) {
            case TAB:
                this.$id.find('ul').attr('aria-hidden', 'true');
                this.$allItems.removeClass('menu-focus');
                this.$activeItem = null;
                this.bChildOpen = false;
                break;

            case ESC:
                var $itemMenu = $item.parent();

                if ($itemMenu.is('.root-level')) {
                    $item.children('ul').first().attr('aria-hidden', 'true');
                }
                else {
                    this.$activeItem = $itemMenu.parent(); //moveup to next item
                    this.bChildOpen = false;
                    this.$activeItem.focus();
                    $itemMenu.attr('aria-hidden', 'true');
                }

                e.stopPropagation();
                return false;

            case ENTER:
            case SPACE:
                var $parentMenu = $item.parent();

                if ($parentMenu.is('.root-level')) {
                    $item.children('ul').first().attr('aria-hidden', 'false');
                }
                else {
                    this.processMenuChoice($item);
                    this.$allItems.removeClass('menu-hover');
                    this.$allItems.removeClass('menu-focus');
                    this.$id.find('ul').not('.root-level').attr('aria-hidden', 'true');
                    this.$activeItem = null;
                }

                e.stopPropagation();
                return false;

            case LEFT:
                this.$activeItem = this.moveToPrevious($item);
                this.$activeItem.focus();
                e.stopPropagation();
                return false;

            case RIGHT:
                this.$activeItem = this.moveToNext($item);
                this.$activeItem.focus();
                e.stopPropagation();
                return false;

            case UP:
                this.$activeItem = this.moveUp($item);
                this.$activeItem.focus();
                e.stopPropagation();
                return false;

            case DOWN:
                this.$activeItem = this.moveDown($item);
                this.$activeItem.focus();
                e.stopPropagation();
                return false;
        }

        return true;
    }


    moveToNext($item) {
        var $itemMenu = $item.parent(); // $item's containing menu
        var $menuItems = $itemMenu.children(); // the items in the currently active menu
        var menuNum = $menuItems.length; // the number of items in the active menu
        var menuIndex = $menuItems.index($item); // the items index in its menu
        var $newItem = null;
        var $childMenu = null;
        var $parentMenus = null;
        var $rootItem = null;

        // In the root level
        if ($itemMenu.is('.root-level')) {
            if (menuIndex < menuNum - 1) { // not the last root menu
                $newItem = $item.next();
            }
            else { // wrap to first item
                $newItem = $menuItems.first();
            }

            if ($item.attr('aria-haspopup') == 'true') {
                $childMenu = $item.children('ul').first();

                if ($childMenu.attr('aria-hidden') == 'false') {
                    $childMenu.attr('aria-hidden', 'true');
                    this.bChildOpen = true;
                }
            }

            $item.removeClass('menu-focus');

            // Open the new menu
            if (($newItem.attr('aria-haspopup') == 'true') && (this.bChildOpen == true)) {
                $childMenu = $newItem.children('ul').first();
                $childMenu.attr('aria-hidden', 'false');
            }
        }
        else {
            if ($item.attr('aria-haspopup') == 'true') {
                $childMenu = $item.children('ul').first();
                $newItem = $childMenu.children('li').first();
                $childMenu.attr('aria-hidden', 'false');
            }
            else {
                $parentMenus = $item.parentsUntil('div').filter('ul').not('.root-level');
                $parentMenus.attr('aria-hidden', 'true');
                $parentMenus.find('li').removeClass('menu-focus');
                $parentMenus.last().parent().removeClass('menu-focus');

                $rootItem = $parentMenus.last().parent();
                menuIndex = this.$rootItems.index($rootItem);

                if (menuIndex < this.$rootItems.length - 1) {
                    $newItem = $rootItem.next();
                }
                else {
                    $newItem = this.$rootItems.first();
                }

                $newItem.addClass('menu-focus');

                if ($newItem.attr('aria-haspopup') == 'true') {
                    $childMenu = $newItem.children('ul').first();
                    $newItem = $childMenu.children('li').first();
                    $childMenu.attr('aria-hidden', 'false');
                    this.bChildOpen = true;
                }
            }
        }

        return $newItem;
    }

    moveToPrevious($item) {
        var $itemUL = $item.parent();
        var $menuItems = $itemUL.children();
        var menuIndex = $menuItems.index($item);
        var $newItem = null;
        var $childMenu = null;

        if ($itemUL.is('.root-level')) {
            if (menuIndex > 0) {
                $newItem = $item.prev();
            }
            else {
                $newItem = $menuItems.last();
            }

            if ($item.attr('aria-haspopup') == 'true') {
                $childMenu = $item.children('ul').first();
                if ($childMenu.attr('aria-hidden') == 'false') {
                    $childMenu.attr('aria-hidden', 'true');
                    this.bChildOpen = true;
                }
            }

            $item.removeClass('menu-focus');

            if (($newItem.attr('aria-haspopup') == 'true') && (this.bChildOpen == true)) {
                $childMenu = $newItem.children('ul').first();
                $childMenu.attr('aria-hidden', 'false');
            }
        }
        else {
            var $parentLI = $itemUL.parent();
            $itemUL.attr('aria-hidden', 'true');
            $item.removeClass('menu-focus');
            $parentLI.removeClass('menu-focus');

            menuIndex = this.$rootItems.index($parentLI);

            if (menuIndex > 0) {
                $newItem = $parentLI.prev();
            }
            else {
                $newItem = this.$rootItems.last();
            }

            $newItem.addClass('menu-focus');

            if ($newItem.attr('aria-haspopup') == 'true') {
                $childMenu = $newItem.children('ul').first();
                $childMenu.attr('aria-hidden', 'false');
                this.bChildOpen = true;
                $newItem = $childMenu.children('li').first();
            }
        }

        return $newItem;
    }


    moveDown($item, startChr) {
        var $itemUL = $item.parent();
        var $menuItems = $itemUL.children();
        var menuNum = $menuItems.length;
        var menuIndex = $menuItems.index($item);
        var $newItem = null;
        var $newItemUL = null;

        if ($itemUL.is('.root-level')) {
            if ($item.attr('aria-haspopup') != 'true') {
                return $item;
            }

            $newItemUL = $item.children('ul').first();
            $newItem = $newItemUL.children('li').first();
            $newItemUL.attr('aria-hidden', 'false');
            return $newItem;
        }

        if (startChr) {
            var bMatch = false;
            var curNdx = menuIndex + 1;

            // check if the active item was the last one on the list
            if (curNdx == menuNum) {
                curNdx = 0;
            }

            // Iterate through the menu items
            while (curNdx != menuIndex) {
                var titleChr = $menuItems.eq(curNdx).html().charAt(0);

                if (titleChr.toLowerCase() == startChr) {
                    bMatch = true;
                    break;
                }

                curNdx = curNdx + 1;

                if (curNdx == menuNum) {
                    // reached the end of the list, start again at the beginning
                    curNdx = 0;
                }
            }

            if (bMatch == true) {
                $newItem = $menuItems.eq(curNdx);
                $item.removeClass('menu-focus');
                return $newItem
            }
            else {
                return $item;
            }
        }
        else {
            if (menuIndex < menuNum - 1) {
                $newItem = $menuItems.eq(menuIndex + 1);
            }
            else {
                $newItem = $menuItems.first();
            }
        }

        $item.removeClass('menu-focus');
        return $newItem;
    }


    moveUp($item) {
        var $itemUL = $item.parent();
        var $menuItems = $itemUL.children();
        var menuIndex = $menuItems.index($item);
        var $newItem = null;

        if ($itemUL.is('.root-level')) {
            return $item;
        }

        if (menuIndex > 0) {
            $newItem = $menuItems.eq(menuIndex - 1);
        }
        else {
            $newItem = $menuItems.last();
        }

        $item.removeClass('menu-focus');
        return $newItem;
    }


    handleKeyPress($item, e) {
        if (e.altKey || e.ctrlKey || e.shiftKey) {
            return true;
        }

        switch (e.keyCode) {
            case TAB:
                return true;

            case ESC:
            case ENTER:
            case SPACE:
            case UP:
            case DOWN:
            case LEFT:
            case RIGHT:
                e.stopPropagation();
                return false;

            default:
                var chr = String.fromCharCode(e.which);
                this.$activeItem = this.moveDown($item, chr);
                this.$activeItem.focus();
                e.stopPropagation();
                return false;
        }
    }

    handleDocumentClick(e) {
        var $childMenus = this.$id.find('ul').not('.root-level');
        $childMenus.attr('aria-hidden', 'true');
        this.$allItems.removeClass('menu-focus');
        this.$activeItem = null;
        return true;
    }


    processMenuChoice($item) {
        var menuName = $item.parent().attr('id');

        switch (menuName) {
            case 'menu1':
                $item.attr('aria-checked', 'true');
                $item.siblings().attr('aria-checked', 'false');
                break;

            case 'menu2':
                if ($item.attr('aria-checked') == 'true') {
                    $item.attr('aria-checked', 'false');
                }
                else {
                    $item.attr('aria-checked', 'true');
                }
                break;

            case 'menu3':
                $item.attr('aria-checked', 'true');
                $item.siblings().attr('aria-checked', 'false');
                break;
        }
    }
}


/***********************/
/*    TAB INTERFACE    */
/***********************/
$("li[role='tab']").keydown(function(ev) {
});

//This adds keyboard function that pressing an arrow left or arrow right from the tabs toggle the tabs.
$("li[role='tab']").keydown(function(ev) {
    switch (ev.which) {
        case ENTER:
            $(this).click();
            break;

        case RIGHT:
        case LEFT:
        case UP:
        case DOWN:
            var selected= $(this).attr("aria-selected");
            if (selected =="true"){
                $("li[aria-selected='false']").attr("aria-selected","true").focus() ;
                $(this).attr("aria-selected","false");
                var tabid= $("li[aria-selected='true']").attr("aria-controls");
                var tab = $("#"+tabid);
                $("div[role='tabpanel']").attr("aria-hidden","true");
                $("div[role='tabpanel']").attr("tabindex", '-1');
                tab.attr("aria-hidden","false");
                tab.attr("tabindex", '0');
            }
            break;
    }
});

$("li[role='tab']").click(function(){
    $("li[role='tab']").attr("aria-selected","false"); //deselect all the tabs
    $(this).attr("aria-selected","true");  // select this tab
    var tabid= $(this).attr("aria-controls"); //find out what tab panel this tab controls
    var tab = $("#"+tabid);
    $("div[role='tabpanel']").attr("aria-hidden","true"); //hide all the panels
    tab.attr("aria-hidden","false");  // show our panel
});
