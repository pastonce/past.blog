> * `Rb_tree`红黑树是一种**平衡二叉查找树**，节点排列规则有利于查找和插入（时间复杂度`O(logn)`），并保持适度的平衡
> * 红黑树**按正常迭代器遍历即可得到排序状态**，是`set/multiset/map/multimap`的底层实现基础

二叉查找树（BST）的特性是：**任意节点的左子树中所有节点的值都小于该节点的值，而右子树中所有节点的值都大于该节点的值**

`Rb_tree`在二叉查找树的基础上还遵循以下规则：

* 每个节点的颜色不是黑色就是红色
* 根节点一定为黑色
* 红色节点的子节点一定为黑色
* 每个叶节点（树尾端的NULL节点）是黑色
* 任意节点到叶节点的每条路径包含的黑色节点数目相同（称为黑色高度）

## Rb_tree-GCC2.9

构建一个`Rb_tree`需要五个模板参数，除了默认的分配器，`Key`指代键类型，`Value`指代**键值组合体`<key|data>`**的类型，`KeyOfValue`表示如何从`Value`中取得`Key`，`Compare`则表示如何对`Key`进行比较

```c++
template <typename Key, typename Value, typename KeyOfValue, typename Compare, typename Alloc = alloc>
class rb_tree {
protected:
    typedef __rb_tree_node<Value> rb_tree_node;
    ...
public:
    typedef rb_tree_node* link_type;
    ...
protected:
    size_type node_count;
    link_type header;
    Compare key_compare;
    ...
};
```

* 可以看到，`Rb_tree`的主要元素为节点数量（4 字节），指向头节点的指针（4字节），以及传入的比较方法（实际为一个仿函数Functor，1 字节），因此**对齐后至少占用的空间大小为 12 字节**（32-bit系统）

* `__rb_tree_node<Value>`的结构示意图如下：

   ![](/blogs/Container-rb_tree/ef9b261fa0047a49.png)

---

一个`Rb_tree`的构建示例如下：

```c++
rb_tree<int, int, identity<int>, less<int>, alloc> myTree;
// -------------------------------------------------------
template <typename Arg, typename Result>
struct unary_function {
    typedef Arg argument_type;
    typedef Result result_type;
};
template <typename T>
struct identity: public unary_function<T, T> {
    const T& operator()(const T& x) const {
        return x;
    }
};
// -------------------------------------------------------
template <typename Arg1, typename Arg2, typename Result>
struct binary_function {
    typedef Arg1 first_argument_type;
    typedef Arg2 second_argument_type;
    typedef Result result_type;
};
template <typename T>
struct less: public binary_function<T, T, bool> {
    bool less operator()(const T& x, const T& y) const {
        return x < y;
    }
};
```

* 由于`identity`的`()`重载函数只是返回参数本身，且`less`比较方法为普通的数值比较，因此`line 1`实际上创建了一个节点值本身为`key`的红黑树
* 另外，`Rb_tree`提供两种插入操作：`insert_unique`和`insert_equal`. 前者表示节点的`key`在树中独一无二，**重复插入不会新增节点**；后者则允许插入节点的`key`在树中有重复

## Rb_tree-GCC4.9

GCC4.9对于`Rb_tree`的实现结构如下所示：

![](/blogs/Container-rb_tree/67e0195d7ca6bd07.png)

```c++
enum _Rb_tree_color { _S_red = false, _S_black = true };
...
typedef _Rb_tree_node_base* _Base_ptr;
```

* 主要元素为 3 个指向树节点的指针以及 1 个枚举类型，至少占用的空间大小为 24 字节（32-bit系统）

    **此处存疑，枚举类型一般占用 4 字节，所以应是  16 字节？*

`Rb_tree`的`iterator`实现如下，注意其中`iterator_category`是**双向移动**类型：

```c++
template<typename _Tp>
struct _Rb_tree_iterator {
    typedef _Tp  value_type;
    typedef _Tp& reference;
    typedef _Tp* pointer;
    typedef bidirectional_iterator_tag iterator_category;
    typedef ptrdiff_t difference_type;

    typedef _Rb_tree_iterator<_Tp> _Self;
    typedef _Rb_tree_node_base::_Base_ptr _Base_ptr;
    typedef _Rb_tree_node<_Tp>* _Link_type;
    ...
    _Base_ptr _M_node;
    
    reference operator*() const
    { return *static_cast<_Link_type>(_M_node)->_M_valptr(); }
    pointer operator->() const
    { return static_cast<_Link_type> (_M_node)->_M_valptr(); }

    _Self& operator++() { // 前置++
        _M_node = _Rb_tree_increment(_M_node);
        return *this;
    }
    _Self operator++(int) { // 后置++
        _Self __tmp = *this;
        _M_node = _Rb_tree_increment(_M_node);
        return __tmp;
    }
    _Self& operator--() { // 前置--
        _M_node = _Rb_tree_decrement(_M_node);
        return *this;
    }
    _Self operator--(int) { // 后置--
        _Self __tmp = *this;
        _M_node = _Rb_tree_decrement(_M_node);
        return __tmp;
    }

    bool operator==(const _Self& __x) const
    { return _M_node == __x._M_node; }
    bool operator!=(const _Self& __x) const
    { return _M_node != __x._M_node; }
};
```