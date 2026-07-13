## 实现关系与分类

* 循列式容器：包括`Array`、`Vector`、`Deque`（双向队列）、`List`（双向链表）、`Forward-List`（单向链表）
    * `Array`的空间在定义时即固定，**无法改变大小**
    * `Vector`空间不足时会进行成长，**找到另一个更大（通常是2倍或1.5倍）的空间位置存放所有数据**，是`heap`和`priority_queue`的底层实现基础
    * `Deque`的数据是通过**分段连续**的方式组织在一起的，是栈`stack`和队列`queue`的底层实现基础
    * `List`**每次扩充一个节点**，空间利用率很高，但查找效率较低
    * `Forward-List`添加元素时需要通过`.push_front()`**头插法**实现
* 关联式容器：包括`Set/Multiset`、`Map/Multimap`，大多数编译器以**红黑树**`rb_tree`作为底层实现
    * 不定序容器：包括`Unordered Set/Multiset`、`Unordered Map/Multimap`，大多数编译器以**哈希链表**`hashtable`作为底层实现

## List-GCC2.9

![](/blogs/container-list/1a22d118651050e7.png)

* 主要元素为一个指向`list_node`的指针`node`，因此**至少占用 4 字节空间**（32-bit系统）

* `list_node`：包含前向指针`prev`、后向指针`next`以及数据`data`

```c++
template <typename T>
struct __list_node {
    typedef void* void_pointer;
    void_pointer prev;
    void_pointer next;
    T data;
};
```

* `iterator`类：包含若干`typedef`以及若干可以应用在指针类型上的操作符重载，如：

    * 前置++的重载，注意此处返回**引用类型**，即左值

        ```c++
        self& operator++() {
            node = (link_type) ((*node).next); // link_type 即为 list_node*
            return *this;
        }
        ```

    * 后置++的重载，注意此处**返回值类型**，即右值

        ```c++
        self operator++(int) {
            self tmp = *this;
            ++*this; // 此处调用重载后的前置++
            return tmp; // 返回原值
        }
        ```

    * 解引用的重载，`reference`实际上是`T&`

        ```c++
        reference operator*() const {
            return (*node).data;
        }
        ```

    * 箭头运算符重载，`pointer`实际上是`T*`

        ```c++
        pointer operator->() const {
            return &(operator*());
        }
        ```


## List-GCC4.9

GCC4.9版本中的主要优化为：

* `iterator`的模板参数由三个（即`T`，`T&`和`T*`，对应上面的`reference`和`pointer`）变为一个`_Tp`

* 节点内前后向指针的类型由`void*`类型变为指向节点的指针类型
```c++
struct _List_node_base {
    _List_node_base* _M_next;
    _List_node_base* _M_prev;
};
    
template<typename _Tp>
struct _List_node : public _List_node_base {
    _Tp _M_data;
};
```

![](/blogs/container-list/162c012fbb283c47.png)

* 如图，双向链表的实现变得更加复杂，由于`list`继承自`_List_base`，因此至少占用的空间大小取决于`_M_impl`结构，即两个指针大小，**一共 8 字节**（32-bit系统）
* 无论哪一个编译器版本，**双向链表（环状）尾端始终有一个空白节点**，用以实现前闭后开原则（详见[[STL 1] | C++ STL体系结构基础](https://past-blog.vercel.app/blog/Standard-Template-Library)）；上图中的`_M_node`即为空白节点，`list.end()`应指向此处